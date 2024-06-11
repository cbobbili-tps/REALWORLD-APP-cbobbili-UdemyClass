describe("Test with backend", () => {
  beforeEach("Login to Application", () => {
    cy.intercept({method: "GET", path: "tags"}, {fixture: "tags.json"});
    cy.LoginToApplication();
  });

  it("Verify correct request and response", () => {
    cy.intercept(
      "POST",
      "https://conduit-api.bondaracademy.com/api/articles/"
    ).as("postArticles");

    cy.contains("New Article").click();
    cy.get('[formcontrolname="title"]').type("New Title");
    cy.get('[formcontrolname="description"]').type("This is a description");
    cy.get('[formcontrolname="body"]').type("This is a body of the article");
    cy.contains("Publish Article").click();

    cy.wait("@postArticles").then((xhr) => {
      console.log(xhr);
      expect(xhr.response.statusCode).to.equal(201);
      expect(xhr.request.body.article.body).to.equal(
        "This is a body of the article"
      );
      expect(xhr.response.body.article.description).to.equal(
        "This is a description"
      );
    });
  });

  it("Intercepting and modyfing request and response", () => {
    // cy.intercept('POST','**/articles', (req) => {
    //   req.body.article.description = "This is a description 2"
    // }).as('postArticles')

    cy.intercept("POST", "**/articles", (req) => {
      req.reply((res) => {
        expect(res.body.article.description).to.equal("This is a description");
        res.body.article.description = "This is a description 2";
      });
    }).as("postArticles");

    cy.contains("New Article").click();
    cy.get('[formcontrolname="title"]').type("New Title");
    cy.get('[formcontrolname="description"]').type("This is a description");
    cy.get('[formcontrolname="body"]').type("This is a body of the article");
    cy.contains("Publish Article").click();

    cy.wait("@postArticles").then((xhr) => {
      console.log(xhr);
      expect(xhr.response.statusCode).to.equal(201);
      expect(xhr.request.body.article.body).to.equal(
        "This is a body of the article"
      );
      expect(xhr.response.body.article.description).to.equal(
        "This is a description 2"
      );
    });
  });

  it("Verify popular tags are displayed", () => {
    cy.get(".tag-list")
      .should("contain", "cypress")
      .and("contain", "automation")
      .and("contain", "testing");
  });

  it("verify global feed likes count", () => {
    cy.intercept("GET", "https://conduit-api.bondaracademy.com/api/articles*", {
      fixture: "articles.json",
    });

    cy.contains("Global Feed").click();
    cy.get("app-article-list button").then((heartList) => {
      expect(heartList[0]).to.contain("75");
      expect(heartList[1]).to.contain("35");
    });

    cy.fixture("articles.json").then((file) => {
      const articleLink = file.articles[1].slug;
      file.articles[1].favoritesCount = 36;
      cy.intercept(
        "POST",
        "https://conduit-api.bondaracademy.com/api/articles/" +
          articleLink +
          "/favorite"
      );
    });

    cy.get("app-article-list button").eq(1).click().should("contain", "36");
  });

  it("delete a new article in a global feed", () => {
    // const userCredentials = {
    //   "user": {
    //     "email": "ctesting@test.com",
    //     "password": "Password1",
    //   },
    // };

    const bodyRequest = {
      "article": {
        "title": "Request from Api",
        "description": "Api Testing is easy",
        "body": "Angular is cool",
        "tagList": ["weird"],
      },
    };

    // cy.request(
    //   "POST",
    //   "https://conduit-api.bondaracademy.com/api/users/login",
    //   userCredentials
    // )
    //   .its("body")
    //   .then((body) => {
    //     const token = body.user.token;
    //     const tokenforarticle = "Token " + token;

    cy.get("@token").then((token) => {
      cy.request({
        url: "https://conduit-api.bondaracademy.com/api/articles/",
        headers: {"Authorization": tokenforarticle},
        method: "POST",
        body: bodyRequest,
      }).then((response) => {
        expect(response.status).to.equal(201);
      });

      cy.contains("Global Feed").click();
      cy.wait(600);
      cy.get(".article-preview").first().click();
      cy.get(".article-actions").contains("Delete Article").click();
      cy.wait(600);

      cy.request({
        url: "https://conduit-api.bondaracademy.com/api/articles?limit=10&offset=0",
        headers: {"Authorization": tokenforarticle},
        method: "GET",
      })
        .its("body")
        .then((body) => {
          expect(body.articles[0].title).not.to.equal("Request from Api");
        });
    });
  });
});
