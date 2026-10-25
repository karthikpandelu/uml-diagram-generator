export const DEFAULT_SOURCE = `// UML Class Diagram — edit this text and watch the diagram update.

class User {
  +id: int
  -name: string
  #createdAt: date
  +login(password: string): bool
  +logout()
}

class Admin {
  +permissions: string
  +ban(user: User)
}

class Order {
  +total: float
}

class LineItem {
  +qty: int
}

class Product
class Cart
class Logger

Admin --|> User            // inheritance
User "1" --> "*" Order : places   // association
Order *-- LineItem          // composition
Cart o-- Product            // aggregation
User ..> Logger             // dependency
`;
