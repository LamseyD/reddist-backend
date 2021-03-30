# reddist-backend
Backend for a reddit clone
Technology used
- MySQL
- TypeScript
- MikroORM
- Node.JS
- TypeORM
- Apollo GraphQL Client
- GraphQL
- Express and Cors

# How to start development
`npm run watch` - start typescript compilation

`npm run dev` - start development server

# Create migration MikroORM
`npm run create:migration` does not work.

Do `npx mikro-orm migration:create` instead.

# Create migration TypeORM

`npx typeorm migration:create -n "name"`

Although most likely typeorm automatically generates SQL for you
