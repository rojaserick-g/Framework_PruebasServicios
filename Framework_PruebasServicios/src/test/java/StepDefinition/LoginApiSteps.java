package StepDefinition;

import io.cucumber.java.en.And;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import io.restassured.response.Response;

import java.util.HashMap;
import java.util.Map;

import static io.restassured.RestAssured.given;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;

public class LoginApiSteps {

    private String usuario;
    private String password;
    private Response response;

    @Given("tengo las credenciales {string} y {string}")
    public void tengoLasCredenciales(String usuario, String password) {
        this.usuario = usuario;
        this.password = password;
    }

    @When("envío una solicitud POST a {string}")
    public void envioSolicitudPost(String endpoint) {
        Map<String, String> body = new HashMap<>();
        body.put("email", usuario);
        body.put("password", password);

        response = given()
                .baseUri("http://localhost:3000")
                .contentType("application/json")
                .body(body)
                .when()
                .post(endpoint);
    }

    @Then("el servicio de login debe responder con código {int}")
    public void validarCodigoRespuesta(int statusCode) {
        assertEquals(statusCode, response.statusCode());
    }

    @And("el campo de login {string} debe ser {string}")
    public void validarCampo(String campo, String valorEsperado) {
        assertEquals(valorEsperado, response.jsonPath().getString(campo));
    }

    @And("el token de autenticación debe estar presente")
    public void validarToken() {
        String token = response.jsonPath().getString("token");
        assertNotNull(token);
        assertFalse(token.isBlank());
    }
}
