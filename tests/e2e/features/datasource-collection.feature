Feature: Datasource collection page

  Background:
    Given the app is loaded

  Scenario: View seeded datasources
    When I navigate to "#/datasources"
    Then the page heading should contain "Datasources"
    And I should see at least 3 datasources in the list
    And the datasource list should contain "sales"
    And the datasource list should contain "customer"
    And the datasource list should contain "product"

  Scenario: Seed datasources are read-only
    When I navigate to "#/datasources"
    Then the datasource "sales" should show "read-only" badge
    And the datasource "sales" should not have a delete button

  Scenario: Create a new datasource
    When I navigate to "#/datasources"
    And I click "New Datasource"
    And I enter the datasource name "Test Collection DS"
    And I click "Create"
    Then I should be on a datasource editor page
    When I navigate to "#/datasources"
    Then the datasource list should contain "Test Collection DS"

  Scenario: Delete a user-created datasource
    Given a user datasource "Temp DS" exists
    When I navigate to "#/datasources"
    Then the datasource list should contain "Temp DS"
    When I delete the datasource "Temp DS" from the list
    Then the datasource list should not contain "Temp DS"
    And I should still see the seed datasources

  Scenario: Datasources nav link is present
    When I navigate to "#/"
    Then the top navigation should have a "Datasources" link
    When I click the "Datasources" nav link
    Then I should be on the datasources collection page

  # E2E-001: datasource created via AppShell persists to localStorage v2 and survives reload
  Scenario: Created datasource persists across page reload
    When I navigate to "#/datasources"
    And I click "New Datasource"
    And I enter the datasource name "Persistent DS"
    And I click "Create"
    Then I should be on a datasource editor page
    When I reload the app
    And I navigate to "#/datasources"
    Then the datasource list should contain "Persistent DS"

  # REG-001: legacy v1 data migrates to v2 on first boot — no data loss
  Scenario: Legacy v1 datasources are preserved after v1-to-v2 migration
    Given a legacy v1 datasource "Migrated DS" exists
    When I navigate to "#/datasources"
    Then the datasource list should contain "Migrated DS"
