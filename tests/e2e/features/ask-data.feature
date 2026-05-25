Feature: Ask Data

  Background:
    Given the app is loaded

  Scenario: User asks a BI question
    Given a seeded datasource is available
    When I navigate to "#/dashboard/portable-bi-dashboard"
    And I switch to Ask Data mode
    And I ask the natural-language sales question "sales by region"
    Then the Ask Data result UI should display results
