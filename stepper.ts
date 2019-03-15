/**
 * Blocks for driving the Kitronik All-in-one Robotics Board (Motors Only, No Servos)
 */
//% weight=100 color=#00A654 icon="\uf1b6" block="Steppers"
//% groups='["Motors", "Settings"]'
namespace Kitronik_Robotics_Stepper {
    //Constants 
    let PRESCALE_REG = 0xFE //the prescale register address
    let MODE_1_REG = 0x00  //The mode 1 register address
    let StepperPause = 20 //initally set the pause at 20mS
    // List of motors for the motor blocks to use. These represent register offsets in the PCA9865 driver IC.
    export enum Motors {
        //% block="Motor 1"
        Motor1 = 0x28,
        //% block="Motor 2"
        Motor2 = 0x30,
        //% block="Motor 3"
        Motor3 = 0x38,
        //% block="Motor 4"
        Motor4 = 0x40
    }

    // List of stepper motors for the stepper motor blocks to use.
    // Stepper 1 would connect to Motor 1 & Motor 2
    // Stepper 2 would connect to Motor 3 & Motor 4
    export enum StepperMotors {
        //% block="Stepper 1"
        Stepper1,
        //% block="Stepper 2"
        Stepper2,
        //% block="Both Steppers"
        BothSteppers
    }

    // List of stepper motors for the stepper motor block dropdowns to use.
    // Stepper 1 would connect to Motor 1 & Motor 2
    // Stepper 2 would connect to Motor 3 & Motor 4
    export enum StepperMotorList {
        //% block="Stepper 1"
        Stepper1,
        //% block="Stepper 2"
        Stepper2
    }

    // Directions the motors can rotate.
    export enum MotorDirection {
        //% block="Forward"
        Forward,
        //% block="Reverse"
        Reverse
    }

    // chipAddress can be changed in 'JavaScript' mode if the I2C address of the board has been altered:
    // 'Kitronik_Robotics_Board.chipAddress = Kitronik_Robotics_Board.BoardAddresses.Boardx' ('x' is one of the BoardAddresses)
    export let chipAddress = 0x6C //default Kitronik Chip address for All-in-One Robotics Board
    let initalised = false //a flag to allow us to initialise without explicitly calling the secret incantation
    export let stepper1Steps = 200 //Default value for the majority of stepper motors; can be altered via a block if neccessary for a particular stepper motor
    export let stepper2Steps = 200 //Default value for the majority of stepper motors; can be altered via a block if neccessary for a particular stepper motor


    /*
        This secret incantation sets up the PCA9865 I2C driver chip to be running at 50Hz pulse repetition, and then sets the 16 output registers to 1.5mS - centre travel.
        It should not need to be called directly be a user - the first motor write will call it automatically.
    */
    function secretIncantation(): void {
        let buf = pins.createBuffer(2)

        //Should probably do a soft reset of the I2C chip here when I figure out how

        // First set the prescaler to 50 hz
        buf[0] = PRESCALE_REG
        buf[1] = 0x85
        pins.i2cWriteBuffer(chipAddress, buf, false)
        //Block write via the all leds register to turn off all servo and motor outputs
        buf[0] = 0xFA
        buf[1] = 0x00
        pins.i2cWriteBuffer(chipAddress, buf, false)
        buf[0] = 0xFB
        buf[1] = 0x00
        pins.i2cWriteBuffer(chipAddress, buf, false)
        buf[0] = 0xFC
        buf[1] = 0x00
        pins.i2cWriteBuffer(chipAddress, buf, false)
        buf[0] = 0xFD
        buf[1] = 0x00
        pins.i2cWriteBuffer(chipAddress, buf, false)
        //Set the mode 1 register to come out of sleep
        buf[0] = MODE_1_REG
        buf[1] = 0x01
        pins.i2cWriteBuffer(chipAddress, buf, false)
        StepperPause = 20 //this is the pause we insert between steps so we allow the mechanical system to move
        //set the initalised flag so we dont come in here again automatically
        initalised = true
    }

    function WriteToPrescaleReg(Value: number) {
        let buf = pins.createBuffer(2)
        //first go to sleep
        buf[0] = MODE_1_REG
        buf[1] = 0x91
        pins.i2cWriteBuffer(chipAddress, buf, false)

        //now write the Value
        buf[0] = PRESCALE_REG
        buf[1] = Value
        pins.i2cWriteBuffer(chipAddress, buf, false)

        //and come out of sleep
        buf[0] = MODE_1_REG
        buf[1] = 0x01
        pins.i2cWriteBuffer(chipAddress, buf, false)
    }

    /**
     * Sets the speed for all stepper motors (expects a number between 1 and 100 where 100 is fast and 1 is slow).
     * @param speed how fast to turn the stepper motor eg: 50
     */
    //% group=Settings
    //% blockId=kitronik_set_stepper_speed
    //% block="set stepper speed to %speed"
    //% weight=50 blockGap=8
    //% speed.min=0 speed.max=100
    export function setStepperSpeed(speed: number) {
        if (initalised == false) {
            secretIncantation()
        }

        let PrescaleValue: number
        StepperPause = Math.map(speed, 0, 100, 20, 0.6)
        PrescaleValue = Math.map(speed, 0, 100, 0x85, 0x03)
        PrescaleValue = Math.round(PrescaleValue)
        WriteToPrescaleReg(PrescaleValue)
    }

    /**
     * Sets the requested motor running in chosen direction at a set speed.
     * if the PCA has not yet been initialised calls the initialisation routine.
     * @param motor which motor to turn on
     * @param dir   which direction to go
     * @param speed how fast to spin the motor
     */
    //% group=Motors
    //% blockId=kitronik_motor_on
    //% block="%motor|on direction %dir|speed %speed"
    //% weight=100 blockGap=8
    //% speed.min=0 speed.max=100
    export function motorOn(motor: Motors, dir: MotorDirection, speed: number): void {
        if (initalised == false) {
            secretIncantation()
        }

        /*convert 0-100 to 0-4095 (approx) We wont worry about the last 95 to make life simpler*/
        //let outputVal = Math.clamp(0, 100, speed) * 40;
        let outputVal = Math.map(speed, 0, 100, 0, 4095)
        outputVal = Math.round(outputVal)
        let buf = pins.createBuffer(2)
        let highByte = false

        switch (dir) {
            case MotorDirection.Forward:
                if (outputVal > 0xFF) {
                    highByte = true
                }
                buf[0] = motor + 4
                buf[1] = outputVal
                pins.i2cWriteBuffer(chipAddress, buf, false)
                if (highByte) {
                    buf[0] = motor + 5
                    buf[1] = outputVal / 256
                }
                else {
                    buf[0] = motor + 5
                    buf[1] = 0x00
                }
                pins.i2cWriteBuffer(chipAddress, buf, false)

                buf[0] = motor
                buf[1] = 0x00
                pins.i2cWriteBuffer(chipAddress, buf, false)
                buf[0] = motor + 1
                buf[1] = 0x00
                pins.i2cWriteBuffer(chipAddress, buf, false)
                break
            case MotorDirection.Reverse:
                if (outputVal > 0xFF) {
                    highByte = true
                }

                buf[0] = motor
                buf[1] = outputVal
                pins.i2cWriteBuffer(chipAddress, buf, false)

                if (highByte) {
                    buf[0] = motor + 1
                    buf[1] = outputVal / 256
                }
                else {
                    buf[0] = motor + 1
                    buf[1] = 0x00
                }
                pins.i2cWriteBuffer(chipAddress, buf, false)

                buf[0] = motor + 4
                buf[1] = 0x00
                pins.i2cWriteBuffer(chipAddress, buf, false)
                buf[0] = motor + 5
                buf[1] = 0x00
                pins.i2cWriteBuffer(chipAddress, buf, false)
                break
        }
    }

    /**
     * Turns off the specified motor.
     * @param motor which motor to turn off
     */
    //% group=Motors
    //% blockId=kitronik_motor_off
    //% weight=70 blockGap=8
    //%block="turn off %motor"
    export function motorOff(motor: Motors): void {

        let buf = pins.createBuffer(2)

        buf[0] = motor
        buf[1] = 0x00
        pins.i2cWriteBuffer(chipAddress, buf, false)
        buf[0] = motor + 1
        buf[1] = 0x00
        pins.i2cWriteBuffer(chipAddress, buf, false)
        buf[0] = motor + 4
        buf[1] = 0x00
        pins.i2cWriteBuffer(chipAddress, buf, false)
        buf[0] = motor + 5
        buf[1] = 0x00
        pins.i2cWriteBuffer(chipAddress, buf, false)
    }

    /**
     * Turns off all motors
     */
    //% group=Motors
    //% blockId=kitronik_robotics_all_off
    //% weight=65 blockGap=8
    //%block="turn off all motors"
    export function allOff(): void {
        let buf = pins.createBuffer(2)

        motorOff(Motors.Motor1)
        motorOff(Motors.Motor2)
        motorOff(Motors.Motor3)
        motorOff(Motors.Motor4)

    }

    /**
     * Set the number of steps per full rotation for a stepper motor
     * motorSteps is defaulted to 200
     * @param stepper which stepper motor to turn on
     * @param steps number of steps for a full rotation, eg: 200
     */
    //% group=Settings
    //% blockId=kitronik_set_stepper_steps
    //% block="%stepper|has %steps|steps in one full rotation"
    //% weight=40 blockGap=8
    export function setStepperMotorSteps(stepper: StepperMotorList, steps: number): void {
        if (stepper == StepperMotorList.Stepper1) {
            Kitronik_Robotics_Stepper.stepper1Steps = steps
        }
        else {
            Kitronik_Robotics_Stepper.stepper2Steps = steps
        }
    }

    /**
     * Sets the requested stepper motor to a chosen angle relative to the start position.
     * if the PCA has not yet been initialised calls the initialisation routine.
     * @param stepper which stepper motor to turn on
     * @param dir   which direction to go
     * @param angle how far to turn the motor relative to start
     */
    //% group=Motors
    //% blockId=kitronik_stepper_motor_turn_angle
    //% block="%stepper|turn %dir|%angle|degrees"
    //% weight=85 blockGap=8
    //% angle.min=1 angle.max=360
    export function stepperMotorTurnAngle(stepper: StepperMotorList, dir: MotorDirection, angle: number): void {
        let angleToSteps = 0
        let actualStepper = 0

        if (initalised == false) {
            secretIncantation()
        }

        //convert angle to motor steps, depends on which stepper is being turned to set the number of steps for a full rotation
        if (stepper == StepperMotorList.Stepper1) {
            angleToSteps = pins.map(angle, 1, 360, 1, stepper1Steps)
        }
        else {
            angleToSteps = pins.map(angle, 1, 360, 1, stepper2Steps)
        }

        if (stepper == StepperMotorList.Stepper1) {
            actualStepper = StepperMotors.Stepper1
        }
        else {
            actualStepper = StepperMotors.Stepper2
        }

        turnStepperMotor(actualStepper, dir, angleToSteps, 0, 0)
    }

    /**
     * Sets the requested stepper motor to turn a set number of steps.
     * if the PCA has not yet been initialised calls the initialisation routine.
     * @param stepper which stepper motor to turn on
     * @param dir   which direction to go
     * @param steps how many steps to turn the motor
     */
    //% group=Motors
    //% blockId=kitronik_stepper_motor_turn_steps
    //% block="%stepper|turn %dir|%steps|steps"
    //% weight=90 blockGap=8
    export function stepperMotorTurnSteps(stepper: StepperMotorList, dir: MotorDirection, steps: number): void {
        let actualStepper = 0

        if (initalised == false) {
            secretIncantation()
        }

        if (stepper == StepperMotorList.Stepper1) {
            actualStepper = StepperMotors.Stepper1
        }
        else {
            actualStepper = StepperMotors.Stepper2
        }

        turnStepperMotor(actualStepper, dir, steps, 0, 0)
    }

    /**
     * Sets both stepper motors to turn a set number of steps.
     * if the PCA has not yet been initialised calls the initialisation routine.
     * @param dir1   which direction to go for Stepper 1
     * @param steps1 how many steps to turn Stepper 1
     * @param dir2   which direction to go for Stepper 2
     * @param steps2 how many steps to turn Stepper 2
     */
    //% group=Motors
    //% blockId=kitronik_both_stepper_motor_turn_steps
    //% block="Stepper 1: %dir1|Steps:%steps1|Stepper 2:%dir2|Steps:%steps2"
    //% weight=80 blockGap=8
    export function bothStepperMotorsTurnSteps(dir1: MotorDirection, steps1: number, dir2: MotorDirection, steps2: number): void {
        if (initalised == false) {
            secretIncantation()
        }

        turnStepperMotor(StepperMotors.BothSteppers, dir1, steps1, dir2, steps2)
    }

    /**
     * Sets both stepper motors to chosen angles relative to the start positions.
     * if the PCA has not yet been initialised calls the initialisation routine.
     * @param dir1   which direction to go for Stepper 1
     * @param angle1 how many degrees to turn Stepper 1 relative to start
     * @param dir2   which direction to go for Stepper 2
     * @param angle2 how many degrees to turn Stepper 2 relative to start
     */
    //% group=Motors
    //% blockId=kitronik_both_stepper_motor_turn_angle
    //% block="Stepper 1: %dir1|Angle:%angle1|Stepper 2:%dir2|Angle:%angle2"
    //% weight=75 blockGap=8
    //% angle1.min=1 angle1.max=360
    //% angle2.min=1 angle2.max=360
    export function bothStepperMotorsTurnAngle(dir1: MotorDirection, angle1: number, dir2: MotorDirection, angle2: number): void {
        let angleToSteps1 = 0
        let angleToSteps2 = 0

        if (initalised == false) {
            secretIncantation()
        }

        //convert angles to motor steps
        angleToSteps1 = pins.map(angle1, 1, 360, 1, stepper1Steps)
        angleToSteps2 = pins.map(angle2, 1, 360, 1, stepper2Steps)

        turnStepperMotor(StepperMotors.BothSteppers, dir1, angleToSteps1, dir2, angleToSteps2)
    }

    // The function called to actually turn the stepper motor a set number of steps
    // This function uses a finite state machine (stepStage) to set each motor output to energise the coils of the stepper motor
    // in the correct sequence in order to continuously drive the stepper motor in a set direction
    // Each stepStage value (1-4) corresponds to particular motor outputs and directions being active (for either stepper output)
    function turnStepperMotor(stepper: StepperMotors, dir1: MotorDirection, steps1: number, dir2: MotorDirection, steps2: number): void {
        let greaterSteps = 0
        let lessSteps = 0
        let stepCounter = 0
        let stepStage = 1 //stepStage determines which coils in the stepper motor will be energised (order is very important to ensure actual turning)
        let currentDirection = 0
        let currentDirection2 = 0
        let currentMotor = 0
        let currentMotor2 = 0

        if (steps1 >= steps2) {
            greaterSteps = steps1
            lessSteps = steps2
        }
        else {
            greaterSteps = steps2
            lessSteps = steps1
        }

        // Loop to run until the number of motor steps set by the user is reached
        while (stepCounter < greaterSteps) {
            // This section uses the current stepStage and user selected Stepper Motor to set which Robotics Board Motor Output Address should be used
            if (stepStage == 1 || stepStage == 3) {
                if (stepper == StepperMotors.Stepper1) {
                    currentMotor = Kitronik_Robotics_Stepper.Motors.Motor1
                }
                else if (stepper == StepperMotors.Stepper2) {
                    currentMotor = Kitronik_Robotics_Stepper.Motors.Motor3
                }
                else {
                    if (stepCounter <= lessSteps) {
                        currentMotor = Kitronik_Robotics_Stepper.Motors.Motor1
                        currentMotor2 = Kitronik_Robotics_Stepper.Motors.Motor3
                    }
                    else {
                        if (lessSteps == steps1) {
                            currentMotor2 = Kitronik_Robotics_Stepper.Motors.Motor3
                        }
                        else {
                            currentMotor = Kitronik_Robotics_Stepper.Motors.Motor1
                        }
                    }
                }
            }
            else {
                if (stepper == StepperMotors.Stepper1) {
                    currentMotor = Kitronik_Robotics_Stepper.Motors.Motor2
                }
                else if (stepper == StepperMotors.Stepper2) {
                    currentMotor = Kitronik_Robotics_Stepper.Motors.Motor4
                }
                else {
                    if (stepCounter <= lessSteps) {
                        currentMotor = Kitronik_Robotics_Stepper.Motors.Motor2
                        currentMotor2 = Kitronik_Robotics_Stepper.Motors.Motor4
                    }
                    else {
                        if (lessSteps == steps1) {
                            currentMotor2 = Kitronik_Robotics_Stepper.Motors.Motor4
                        }
                        else {
                            currentMotor = Kitronik_Robotics_Stepper.Motors.Motor2
                        }
                    }
                }
            }

            // This section uses the current stepStage to set which direction the Robotics Board Motor Output should be driven
            if (stepStage == 1 || stepStage == 4) {
                currentDirection = Kitronik_Robotics_Stepper.MotorDirection.Forward
            }
            else {
                currentDirection = Kitronik_Robotics_Stepper.MotorDirection.Reverse
            }

            // Function call for the Robotics Board motor drive with the previously set currentMotor and currentDirection
            if (stepper == StepperMotors.Stepper1 || stepper == StepperMotors.Stepper2) {
                Kitronik_Robotics_Stepper.motorOn(currentMotor, currentDirection, 100)
            }
            else {
                if (dir1 == dir2) {
                    currentDirection2 = currentDirection
                }
                else {
                    switch (stepStage) {
                        case 1: 
                            currentMotor2 = Kitronik_Robotics_Stepper.Motors.Motor4
                            currentDirection2 = Kitronik_Robotics_Stepper.MotorDirection.Reverse
                            break
                        case 2:
                            currentMotor2 = Kitronik_Robotics_Stepper.Motors.Motor3
                            currentDirection2 = Kitronik_Robotics_Stepper.MotorDirection.Forward
                            break
                        case 3:
                            currentMotor2 = Kitronik_Robotics_Stepper.Motors.Motor4
                            currentDirection2 = Kitronik_Robotics_Stepper.MotorDirection.Forward
                            break
                        case 4:
                            currentMotor2 = Kitronik_Robotics_Stepper.Motors.Motor3
                            currentDirection2 = Kitronik_Robotics_Stepper.MotorDirection.Reverse
                            break
                    }
                }

                if (stepCounter <= lessSteps) {
                    Kitronik_Robotics_Stepper.motorOn(currentMotor, currentDirection, 100)
                    Kitronik_Robotics_Stepper.motorOn(currentMotor2, currentDirection2, 100)
                }
                else {
                    if (lessSteps == steps1) {
                        Kitronik_Robotics_Stepper.motorOn(currentMotor2, currentDirection2, 100)
                    }
                    else {
                        Kitronik_Robotics_Stepper.motorOn(currentMotor, currentDirection, 100)
                    }
                }
            }
            //basic.pause(StepperPause)
            let StepperPauseMicro = Math.round(1000 * StepperPause)
            control.waitMicros(StepperPauseMicro)
            // This section progresses the stepStage depending on the user selected Stepper Motor direction and previous stepStage
            switch (dir1) {
                case MotorDirection.Forward:
                    if (stepStage == 4) {
                        stepStage = 1
                    }
                    else {
                        stepStage += 1
                    }
                    break
                case MotorDirection.Reverse:
                    if (stepStage == 1) {
                        stepStage = 4
                    }
                    else {
                        stepStage -= 1
                    }
                    break
            }
            stepCounter += 1
        }
    }
} 