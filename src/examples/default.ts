export const DEFAULT_SOURCE = `// UML Class Diagram — edit this text (or double-click any name/member in the
// diagram) and watch it update. This sample shows every node kind, member
// style, and relationship the notation supports.
//
// The type hierarchy reads top-to-bottom the way a real system layers it:
//   InterfaceA  (contract, most abstract)
//      ▲  realization
//   BaseClass   (abstract — partial implementation)
//      ▲  inheritance
//   ClassA      (concrete — full implementation)

interface InterfaceA {
  +execute(token: string): bool
}

abstract class BaseClass {
  #id: int
  +process(input: string): bool
  +reset()
}

class ClassA {
  -fieldA: string
  #fieldB: date
  +methodA(x: int, y: int): void
}

class ClassB {
  +fieldC: float
  +status: EnumA
}

class ClassC {
  +fieldD: int
}

class ClassD
class ClassE
class ClassF

enum EnumA {
  VALUE_ONE
  VALUE_TWO
  VALUE_THREE
}

BaseClass ..|> InterfaceA      // realization (abstract class implements the interface)
ClassA --|> BaseClass          // inheritance (concrete class extends the abstract base)
ClassA "1" --> "*" ClassB : association   // association with multiplicities + label
ClassB *-- ClassC              // composition
ClassD o-- ClassE              // aggregation
ClassA ..> ClassF              // dependency
ClassB --> EnumA               // association to an enum
`;
