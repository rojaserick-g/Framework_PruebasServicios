@api @login
Feature: Autenticación de usuarios mediante API

  Scenario: Login exitoso con credenciales válidas
    Given tengo las credenciales "test01@test.com" y "Test1234"
    When envío una solicitud POST a "/auth/login"
    Then el servicio de login debe responder con código 200
    And el campo de login "status" debe ser "success"
    And el campo de login "user.email" debe ser "test01@test.com"
    And el token de autenticación debe estar presente

  Scenario: Login rechazado con credenciales inválidas
    Given tengo las credenciales "test01@test.com" y "PasswordIncorrecta"
    When envío una solicitud POST a "/auth/login"
    Then el servicio de login debe responder con código 400
    And el campo de login "error" debe ser "Credenciales inválidas"
