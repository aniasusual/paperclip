import requests
import sys
import json
from datetime import datetime

class IdeaLoggerAPITester:
    def __init__(self, base_url="https://idea-hub-273.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.created_idea_id = None
        self.created_category_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)
            elif method == 'PATCH':
                response = requests.patch(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_get_categories(self):
        """Test GET /api/categories - should return 5 default categories"""
        success, response = self.run_test(
            "Get Categories (5 default)",
            "GET",
            "categories",
            200
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} categories")
            if len(response) >= 5:
                print("   ✅ Has 5+ default categories")
                return True
            else:
                print("   ❌ Expected at least 5 default categories")
        return False

    def test_create_idea(self):
        """Test POST /api/ideas"""
        test_data = {
            "title": "Test Idea for API Testing",
            "content": "This is a test idea created during API testing",
            "category": "Tech",
            "tags": ["testing", "api"],
            "priority": "high"
        }
        success, response = self.run_test(
            "Create Idea",
            "POST",
            "ideas",
            200,
            data=test_data
        )
        if success and 'id' in response:
            self.created_idea_id = response['id']
            print(f"   Created idea with ID: {self.created_idea_id}")
            return True
        return False

    def test_get_ideas(self):
        """Test GET /api/ideas"""
        success, response = self.run_test(
            "Get Ideas",
            "GET",
            "ideas",
            200
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} ideas")
            return True
        return False

    def test_get_ideas_with_filters(self):
        """Test GET /api/ideas with various filters"""
        filters = [
            {"search": "test", "name": "Search Filter"},
            {"category": "Tech", "name": "Category Filter"},
            {"priority": "high", "name": "Priority Filter"},
            {"archived": "true", "name": "Archived Filter"}
        ]
        
        all_passed = True
        for filter_params in filters:
            name = filter_params.pop("name")
            success, response = self.run_test(
                f"Get Ideas with {name}",
                "GET",
                "ideas",
                200,
                params=filter_params
            )
            if not success:
                all_passed = False
        return all_passed

    def test_update_idea(self):
        """Test PUT /api/ideas/{id}"""
        if not self.created_idea_id:
            print("❌ No idea ID available for update test")
            return False
            
        update_data = {
            "title": "Updated Test Idea",
            "content": "This idea has been updated",
            "priority": "medium"
        }
        success, response = self.run_test(
            "Update Idea",
            "PUT",
            f"ideas/{self.created_idea_id}",
            200,
            data=update_data
        )
        return success

    def test_archive_idea(self):
        """Test PATCH /api/ideas/{id}/archive"""
        if not self.created_idea_id:
            print("❌ No idea ID available for archive test")
            return False
            
        success, response = self.run_test(
            "Archive Idea",
            "PATCH",
            f"ideas/{self.created_idea_id}/archive",
            200
        )
        if success and 'archived' in response:
            print(f"   Archived status: {response['archived']}")
            return True
        return False

    def test_get_tags(self):
        """Test GET /api/tags"""
        success, response = self.run_test(
            "Get Tags",
            "GET",
            "tags",
            200
        )
        if success and isinstance(response, list):
            print(f"   Found {len(response)} tags")
            return True
        return False

    def test_get_stats(self):
        """Test GET /api/stats"""
        success, response = self.run_test(
            "Get Stats",
            "GET",
            "stats",
            200
        )
        if success and isinstance(response, dict):
            expected_keys = ['total_active', 'total_archived', 'high_priority', 'medium_priority', 'low_priority']
            has_all_keys = all(key in response for key in expected_keys)
            if has_all_keys:
                print(f"   Stats: {response}")
                return True
            else:
                print(f"   ❌ Missing expected keys in stats response")
        return False

    def test_create_category(self):
        """Test POST /api/categories"""
        test_data = {
            "name": "Test Category",
            "color": "#FF5733"
        }
        success, response = self.run_test(
            "Create Category",
            "POST",
            "categories",
            200,
            data=test_data
        )
        if success and 'id' in response:
            self.created_category_id = response['id']
            print(f"   Created category with ID: {self.created_category_id}")
            return True
        return False

    def test_delete_category(self):
        """Test DELETE /api/categories/{id}"""
        if not self.created_category_id:
            print("❌ No category ID available for delete test")
            return False
            
        success, response = self.run_test(
            "Delete Category",
            "DELETE",
            f"categories/{self.created_category_id}",
            200
        )
        return success

    def test_delete_idea(self):
        """Test DELETE /api/ideas/{id}"""
        if not self.created_idea_id:
            print("❌ No idea ID available for delete test")
            return False
            
        success, response = self.run_test(
            "Delete Idea",
            "DELETE",
            f"ideas/{self.created_idea_id}",
            200
        )
        return success

def main():
    print("🚀 Starting Idea Logger API Tests")
    print("=" * 50)
    
    tester = IdeaLoggerAPITester()
    
    # Run all tests in order
    test_results = []
    
    # Basic CRUD tests
    test_results.append(("Get Categories", tester.test_get_categories()))
    test_results.append(("Create Idea", tester.test_create_idea()))
    test_results.append(("Get Ideas", tester.test_get_ideas()))
    test_results.append(("Get Ideas with Filters", tester.test_get_ideas_with_filters()))
    test_results.append(("Update Idea", tester.test_update_idea()))
    test_results.append(("Archive Idea", tester.test_archive_idea()))
    test_results.append(("Get Tags", tester.test_get_tags()))
    test_results.append(("Get Stats", tester.test_get_stats()))
    test_results.append(("Create Category", tester.test_create_category()))
    test_results.append(("Delete Category", tester.test_delete_category()))
    test_results.append(("Delete Idea", tester.test_delete_idea()))
    
    # Print results summary
    print("\n" + "=" * 50)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 50)
    
    for test_name, passed in test_results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print(f"\n📈 Overall: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())