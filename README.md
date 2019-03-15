# pxt-kitronik-robotics-stepper

Custom blocks for www.kitronik.co.uk/5641 All-in-one Robotics Board for micro:bit (Motors Only, no Servos)

## Motors

This package contains a block for driving standard motors forwards and backwards, with a speed setting of 0-100%:
```blocks
Kitronik_Robotics_Stepper.motorOn(Kitronik_Robotics_Stepper.Motors.Motor3, Kitronik_Robotics_Stepper.MotorDirection.Forward, 10)
Kitronik_Robotics_Stepper.motorOn(Kitronik_Robotics_Stepper.Motors.Motor4, Kitronik_Robotics_Stepper.MotorDirection.Reverse, 100)
```
There are also blocks for driving individual stepper motors forwards and backwards by either a set number of steps, or to an angle relative to the start position:
```blocks
Kitronik_Robotics_Stepper.stepperMotorTurnAngle(Kitronik_Robotics_Stepper.StepperMotorList.Stepper1, Kitronik_Robotics_Stepper.MotorDirection.Forward, 180)
Kitronik_Robotics_Stepper.stepperMotorTurnSteps(Kitronik_Robotics_Stepper.StepperMotorList.Stepper1, Kitronik_Robotics_Stepper.MotorDirection.Reverse, 100)
```
Both stepper motor outputs can be driven simulataneously, with different directions and distances (steps or degrees):
```blocks
Kitronik_Robotics_Stepper.bothStepperMotorsTurnSteps(
Kitronik_Robotics_Stepper.MotorDirection.Forward,
100,
Kitronik_Robotics_Stepper.MotorDirection.Reverse,
60
)
Kitronik_Robotics_Stepper.bothStepperMotorsTurnAngle(
Kitronik_Robotics_Stepper.MotorDirection.Reverse,
360,
Kitronik_Robotics_Stepper.MotorDirection.Forward,
45
)
```
Individual motor outputs can also be turned off.
```blocks
Kitronik_Robotics_Stepper.motorOff(Kitronik_Robotics_Stepper.Motors.Motor3)
```
This package also contains an 'emergency stop' block which turns off all motor outputs at the same time:
```blocks
Kitronik_Robotics_Stepper.allOff()
```

## Settings

This package contains a block for setting how many steps there are in a full rotation for the stepper motors being used:
```blocks
Kitronik_Robotics_Stepper.setStepperMotorSteps(Kitronik_Robotics_Stepper.StepperMotorList.Stepper1, 200)
```
(Note: The default value for both Stepper 1 and 2 is 200 as this is the msot common number of steps in a full rotation)

The speed of the stepper motors can also be set (ranging from 1-100%):
```blocks
Kitronik_Robotics_Stepper.setStepperSpeed(50)
```

## License

MIT
