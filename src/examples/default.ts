export const DEFAULT_SOURCE = `// UML Class Diagram — edit this text and watch the diagram update.

abstract class Account {
  #id: int
  +login(password: string): bool
  +logout()
}

interface Authenticatable {
  +authenticate(token: string): bool
}

class User {
  -name: string
  #createdAt: date
}

class Admin {
  +permissions: string
  +ban(user: User)
}

class Order {
  +total: float
  +status: OrderStatus
}

enum OrderStatus {
  PENDING
  PAID
  SHIPPED
  CANCELLED
}

class LineItem {
  +qty: int
}

class Product
class Cart
class Logger

User --|> Account           // inheritance (abstract base)
User ..|> Authenticatable   // realization (interface)
Admin --|> User             // inheritance
User "1" --> "*" Order : places   // association
Order *-- LineItem          // composition
Cart o-- Product            // aggregation
User ..> Logger             // dependency
Order --> OrderStatus       // association to an enum
`;
