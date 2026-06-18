export const PROJECTS = [
  {
    no: '01',
    title: 'STM32 Projector Control System',
    kind: 'Embedded control · motorized optics',
    meta: 'MCU / STM32',
    blurb:
      'Closed-loop firmware driving a motorized projector mount — PWM actuation with sensor feedback and a tuned control loop for smooth, repeatable positioning.',
    tags: ['STM32', 'C', 'PWM', 'UART'],
    spec: 'MCU STM32F4 · closed-loop · PWM',
    year: '2024',
    img: 'control board',
  },
  {
    no: '02',
    title: 'Aquaponics Systems Engineering',
    kind: 'Sensing · automation',
    meta: 'SENSOR LOOP',
    blurb:
      'An instrumented aquaponics loop: pH, dissolved-oxygen and temperature sensing feeding relay-driven automation, with data logged for tuning.',
    tags: ['Sensors', 'Automation', 'Relays', 'Logging'],
    spec: 'pH / DO / temp · relay control',
    year: '2024',
    img: 'system rig',
  },
  {
    no: '03',
    title: 'InspiritAI Diabetes Prediction Model',
    kind: 'Machine learning · data',
    meta: 'PYTHON / MODELING',
    blurb:
      'A supervised classification model for diabetes risk — feature engineering, model selection, and an honest read on what actually moved accuracy.',
    tags: ['Python', 'scikit-learn', 'Pandas', 'Modeling'],
    spec: 'classification · cross-validated',
    year: '2023',
    img: 'notebook',
  },
  {
    no: '04',
    title: 'Electric Vehicle Hardware Systems',
    kind: 'Power · high-voltage systems',
    meta: 'HARDWARE / DEBUG',
    blurb:
      'Hardware work across an EV powertrain — high-voltage pack integration, battery management, and CAN-bus communication between subsystems.',
    tags: ['HV', 'BMS', 'CAN', 'Power'],
    spec: 'HV pack · BMS · CAN bus',
    year: '2023',
    img: 'pack assembly',
  },
  {
    no: '05',
    title: 'Dental Office Website + IT Systems',
    kind: 'Full-stack · IT',
    meta: 'WEB / DEPLOY',
    blurb:
      'End-to-end build for a dental practice: a clean web front end plus the practical networking, deployment and IT systems behind it.',
    tags: ['Web', 'IT', 'Networking', 'Deploy'],
    spec: 'web stack · network · deploy',
    year: '2022',
    img: 'site / network',
  },
];
