Pokemon Collection API
---

This API lets users manage Pokémon data. They can create, read, update, and delete Pokémon entries and can also do with users. It gets extra Pokémon details from other APIs. It also uses JWT for user authentication and access control.

### Technologies Used

1. Node.js :  run JavaScript on the server.
2. Prisma ORM : interact with databases. 
3. Express (Hono framework)
4. bcrypt for password hashing : use to encrypt and secure user passwords
5. Axios( for HTTP requests): fetch data from external sources


#### Start the server:
```
npm run dev
```



API Endpoints
---

### Authentication

#### POST /login

1. Authenticates a user by checking credentials (email and password) against the database.

2. If successful, returns a JWT token for accessing protected routes.


### User Operations

#### POST /register
1. Registers a new user with encrypted password storage using bcrypt.

2. The inputs are (id, first name, middle name, last name, date of birth, gender, email, password, phone number).

##### Note that dob ("1990-05-15") and phone-number should be in string formate("")

3. Success message with the newly created user's email.


#### PATCH /users/

1. Updates a specific user's details identified by id.

2. Inputs are updated user details.

3. Success message with the updated user object.

#### DELETE /users/

1. Deletes a specific user identified by id.

2. Success message confirming user deletion.


### Collection Operations
#### POST /collection
1. Adds a new Pokémon to the collection by fetching details from PokeAPI based on the Pokémon name provided.

2. Input is pokemon name.

3. Return confirmation message with details of the newly created Pokemon entry.


#### POST /collection/create
1. Adds a new Pokemon to the collection using data provided in the request body or we can create a new pokemon.

2. inputs are Pokemon details (pokeimg, pokeid, pokename, height, weight, abilities, poketypes).

3. Returns confirmation message with details of the newly created Pokemon entry.

#### GET /collection
1. Retrieves all Pokemon entries in the collection(prisma studioor database).

2. List of all Pokémon entries currently stored(in database).

![alt text](<Screenshot (404).png>)



#### GET /collection/name/pokemon-name
1.  Retrieves details of a Pokémon by its name from PokeAPI.

2. You can get it by [localhost:8080/collection/name/pokemon-name]

3. Return details including image, ID, name, height, weight, abilities, and types of the Pokemon.

#### GET /collection/
1. Retrieves details of a specific Pokémon in the collection by its unique ID.

2. You can get it by [localhost:8080/collection/id] (the id should be store in database, so that it will show the particular id details)

3. Returns details of the Pokemon with the specified ID.


#### PATCH /collection/
1. Updates details of a specific Pokémon in the collection identified by its ID.

2. Inputs are the updated Pokemon details (pokeimg, pokeid, pokename, height, weight, abilities, poketypes).

3. Returns confirmation message with details of the updated Pokemon entry.

#### DELETE /collection/
1. Deletes a specific Pokémon from the collection identified by its ID.

### Rate Limiting
Limits requests to /users and /collection endpoints to 10 requests per second. The purpose for this is to ensures that no single user or app sends too many requests too quickly, which helps keep the API running smoothly for everyone. 


### Error Handling
Error handling within the API is essential for maintaining smooth operation and ensuring users receive accurate feedback in case of issues. 