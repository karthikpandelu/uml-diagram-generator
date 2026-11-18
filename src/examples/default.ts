export const DEFAULT_SOURCE = `// UML Class Diagram — edit this text (or double-click any name/member in the
// diagram) and watch it update. This sample shows every node kind, member
// style, and relationship the notation supports.

abstract class BaseClass {
  #id: int
  +process(input: string): bool
  +reset()
}

interface InterfaceA {
  +execute(token: string): bool
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

ClassA --|> BaseClass          // inheritance (generalization)
ClassA ..|> InterfaceA         // realization (implements interface)
ClassB --|> ClassA             // inheritance
ClassA "1" --> "*" ClassB : association   // association with multiplicities + label
ClassB *-- ClassC              // composition
ClassD o-- ClassE              // aggregation
ClassA ..> ClassF              // dependency
ClassB --> EnumA               // association to an enum
`;
