import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { PrismaClient, Prisma } from "@prisma/client";
import { HTTPException } from "hono/http-exception";
import { decode, sign, verify } from "hono/jwt";
import { jwt } from "hono/jwt";
import bcrypt from "bcrypt";
import { resolve } from "path";

type Variables = JwtVariables;

const prisma = new PrismaClient();
const app = new Hono<{ Variables: Variables }>()

// Rate Limiting Middleware
function rateLimit(limit: number, interval: number) {
  const queue: number[] = [];

  return async (context: any, next: any) => {
    const now = Date.now();
    queue.push(now);

    while (queue[0] && queue[0] < now - interval) {
      queue.shift();
    }

    // Check if queue length exceeds limit and if it exits send the status  HTTP 429 Too Many Requests
    if (queue.length > limit) {
      return context.json({ message: "Rate limit exceeded" }, 429);
    }

    await next();
  };
}

// Apply CORS globally
app.use("/*", cors());

// JWT middleware for protected routes
app.use(
  "/protected/*",
  jwt({
    secret: 'mySecretKey',
  })
);


// HOME ROUT
app.get("/", (c) => {
  return c.text("Hello Hono!");
});

// Apply CORS globally
app.use("/*", cors());

// Apply rate limiting middleware to specific routes
const rateLimitMiddleware = rateLimit(10, 1000); // 10 requests per second
app.use("/users", rateLimitMiddleware);
app.use("/collection", rateLimitMiddleware);

// HOME ROUTE
app.get("/", (c) => {
  return c.text("Hello Hono!");
});

// CRUD for Users

// Create a new user
app.post("/register", async (c) => {
  try {
    const body = await c.req.json();
    const bcryptHash = await bcrypt.hash(body.password, 10);
    const user = await prisma.users.create({
      data: {
        id: body.id,
        f_name: body.f_name,
        m_name: body.m_name,
        l_name: body.l_name,
        dob: body.dob ? new Date(body.dob) : undefined,
        gender: body.gender,
        email: body.email,
        password: bcryptHash,
        phonenumber: body.phonenumber,
      
      },
    });

    return c.json({ message: `${user.email} created successfully}` });
  } catch (error) {
    return c.json({ error: error });
  }
});

// Update a specific user by ID
app.patch("/users/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const data = {
      f_name: body.f_name,
      m_name: body.m_name,
      l_name: body.l_name,
      dob: body.dob ? new Date(body.dob) : undefined,
      gender: body.gender,
      email: body.email,
      phonenumber: body.phonenumber,
      password: body.password ? await bcrypt.hash(body.password, 10) : undefined,
    };
    const updatedUser = await prisma.users.update({
      where: { id: Number(id) },
      data: data,
    });
    return c.json({ message: "User updated successfully", user: updatedUser });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return c.json({ message: 'User not found' }, 404);
    }
    return c.json({ message: "An error occurred while updating the user" }, 500);
  }
});

// Delete a specific user by ID
app.delete("/users/:id", async (c) => {
  try {
    const id = c.req.param("id");
    await prisma.users.delete({
      where: { id: Number(id) },
    });
    return c.json({ message: "User deleted successfully" });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return c.json({ message: 'User not found' }, 404);
    }
    return c.json({ message: "An error occurred while deleting the user" }, 500);
  }
});

// Login endpoint
app.post("/login", async (c) => {
  try {
    const body = await c.req.json();

    const user = await prisma.users.findUnique({
      where: { email: body.email },
    });

    if (!user) {
      return c.json({ message: "User not found" }, 404);
    }

    const passwordMatch = await bcrypt.compare(body.password, user.password);
    if (!passwordMatch) {
      throw new HTTPException(401, { message: "Invalid credentials" });
    }

    const payload = {
      userId: user.id,
      email: user.email,
      role: "user", // Example role
    };
    const secret = process.env.JWT_SECRET || "mySecretKey";
    const token = await sign(payload, secret);


    return c.json({ message: "Login successful", token });
  } catch (error) {
    console.error(error);
    throw new HTTPException(401, { message: "Invalid credentials" });
  }
});




// CRUD for MyCollection

// Create a new collection entry
app.post("/collection", async (c) => {
  try {
    const body = await c.req.json();

    const collection = await prisma.mycollection.create({
      data: {
        pokeimg: body.pokeimg,
        pokeid: body.pokeid,
        pokename: body.pokename,
        height: body.height,
        weight: body.weight,
        abilities: body.abilities,
        poketypes: body.poketypes,
      },
    });

    return c.json({ message: `Collection entry created successfully`, collection });
  } catch (e) {
    return c.json({ message: "An error occurred while creating the collection entry" }, 500);
  }
});

// Retrieve all collection entries
app.get("/collection", async (c) => {
  try {
    const collections = await prisma.mycollection.findMany();
    return c.json(collections);
  } catch (e) {
    return c.json({ message: "An error occurred while fetching collection entries" }, 500);
  }
});

// Retrieve a specific collection entry by ID
app.get("/collection/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const collection = await prisma.mycollection.findUnique({
      where: { id: Number(id) },
    });
    if (!collection) {
      return c.json({ message: "Collection entry not found" }, 404);
    }
    return c.json(collection);
  } catch (e) {
    return c.json({ message: "An error occurred while fetching the collection entry" }, 500);
  }
});

// Update a specific collection entry by ID
app.patch("/collection/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const updatedCollection = await prisma.mycollection.update({
      where: { id: Number(id) },
      data: {
        pokeimg: body.pokeimg,
        pokeid: body.pokeid,
        pokename: body.pokename,
        height: body.height,
        weight: body.weight,
        abilities: body.abilities,
        poketypes: body.poketypes,
      },
    });
    return c.json({ message: "Collection entry updated successfully", collection: updatedCollection });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return c.json({ message: 'Collection entry not found' }, 404);
    }
    return c.json({ message: "An error occurred while updating the collection entry" }, 500);
  }
});

// Delete a specific collection entry by ID
app.delete("/collection/:id", async (c) => {
  try {
    const id = c.req.param("id");
    await prisma.mycollection.delete({
      where: { id: Number(id) },
    });
    return c.json({ message: "Collection entry deleted successfully" });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return c.json({ message: 'Collection entry not found' }, 404);
    }
    return c.json({ message: "An error occurred while deleting the collection entry" }, 500);
  }
});

// Serve 
const port = 8080;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});