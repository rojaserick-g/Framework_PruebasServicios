@api @health
Feature: Validación del Mock API

  Scenario: Validar que el Mock API se encuentra activo
    When consulto el estado del Mock API
    Then el servicio debe responder con código 200
    And el campo "status" debe ser "ok"
    And el campo "message" debe ser "Mock API activo"
