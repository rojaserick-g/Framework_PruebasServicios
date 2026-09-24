package StepDefinition;

import io.cucumber.java.en.And;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import io.restassured.response.Response;

import static io.restassured.RestAssured.given;
import static org.junit.jupiter.api.Assertions.assertEquals;

public class HealthApiSteps {

    private Response response;

    @When("consulto el estado del Mock API")
    public void consultoElEstadoDelMockApi() {
        response = given()
                .baseUri("http://localhost:3000")
                .when()
                .get("/");
    }

    @Then("el servicio debe responder con código {int}")
    public void validarCodigoRespuesta(int statusCode) {
        assertEquals(statusCode, response.statusCode());
    }

    @And("el campo {string} debe ser {string}")
    public void validarCampoRespuesta(String campo, String valorEsperado) {
        assertEquals(valorEsperado, response.jsonPath().getString(campo));
    }
}
