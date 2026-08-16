export interface LearningTopic {
  slug: string
  navLabel: string
  title: string
  shortDescription: string
  description: string
  image: string
  imageAlt: string
  projects: string[]
  skills: string[]
  faqs: Array<{ question: string; answer: string }>
}

export const learningTopics: LearningTopic[] = [
  {
    slug: 'stem-steam-programs',
    navLabel: 'STEM & STEAM',
    title: 'STEM & STEAM Programs for Kids in Sydney',
    shortDescription: 'Creative projects that connect science, technology, engineering, arts and mathematics.',
    description:
      'TinkerTank brings STEM and STEAM disciplines together through practical projects. Children investigate ideas, design solutions, build prototypes, test their work and improve it with support from experienced facilitators.',
    image: '/images/workshop.jpg',
    imageAlt: 'Children working together on a hands-on STEAM project at TinkerTank',
    projects: [
      'Combine coding, robotics and engineering to solve practical challenges',
      'Use design and creative technology to turn an idea into a working project',
      'Test, troubleshoot and improve projects through experimentation'
    ],
    skills: ['Creative problem-solving', 'Collaboration', 'Critical thinking', 'Resilience through iteration'],
    faqs: [
      {
        question: 'What is the difference between STEM and STEAM?',
        answer: 'STEM brings together science, technology, engineering and mathematics. STEAM adds arts and design, helping children combine technical thinking with creativity and communication.'
      },
      {
        question: 'Does my child need previous STEM experience?',
        answer: 'No. Projects are adapted to each child’s age, interests and experience, so beginners can start confidently while experienced makers take on deeper challenges.'
      },
      {
        question: 'Which TinkerTank programs include STEM and STEAM?',
        answer: 'STEAM learning runs through TinkerTank camps, weekly Ignite sessions, birthday parties and school programs.'
      }
    ]
  },
  {
    slug: 'robotics-for-kids',
    navLabel: 'Robotics',
    title: 'Robotics for Kids in Sydney',
    shortDescription: 'Build, program, test and improve robots through hands-on challenges.',
    description:
      'Children learn robotics by making things move, respond and solve challenges. They connect building and programming, test what happens in the real world and improve their designs when the first attempt does not work as planned.',
    image: '/images/battle.jpg',
    imageAlt: 'Children building and testing robots at TinkerTank',
    projects: [
      'Build and program robots for challenges and friendly competitions',
      'Experiment with movement, control and responsive behaviour',
      'Diagnose problems and improve both code and physical designs'
    ],
    skills: ['Computational thinking', 'Engineering design', 'Testing and debugging', 'Teamwork'],
    faqs: [
      {
        question: 'What ages are TinkerTank robotics activities for?',
        answer: 'TinkerTank programs serve children aged 5-16, with robotics equipment and challenges adapted to each age group and level of experience.'
      },
      {
        question: 'Does my child need to own a robotics kit?',
        answer: 'No. TinkerTank supplies the equipment and materials needed for activities delivered at our venues or through participating schools.'
      },
      {
        question: 'Where can children learn robotics with TinkerTank?',
        answer: 'Robotics is included across camps, weekly Ignite programs, birthday parties and school programs in Northern Sydney.'
      }
    ]
  },
  {
    slug: 'coding-for-kids',
    navLabel: 'Coding',
    title: 'Coding for Kids in Sydney',
    shortDescription: 'Create games, stories and interactive projects while learning how code works.',
    description:
      'TinkerTank makes coding tangible and creative. Children plan what they want a project to do, break the problem into steps, build their solution and debug it through experimentation rather than simply following instructions.',
    image: '/images/code-1.jpg',
    imageAlt: 'A child creating a coding project at TinkerTank',
    projects: [
      'Create interactive games, stories and challenges',
      'Explore coding through experiences such as Scratch, Minecraft and AI',
      'Plan sequences, test outcomes and debug unexpected behaviour'
    ],
    skills: ['Logical thinking', 'Programming concepts', 'Debugging', 'Digital creativity'],
    faqs: [
      {
        question: 'Is TinkerTank coding suitable for beginners?',
        answer: 'Yes. Facilitators adapt activities for beginners and experienced young coders, helping each child progress from their current level.'
      },
      {
        question: 'What coding platforms does TinkerTank use?',
        answer: 'Activities can include platforms and creative environments such as Scratch, Minecraft and AI tools. The exact project varies by program, age group and session.'
      },
      {
        question: 'Which programs include coding?',
        answer: 'Coding is part of TinkerTank camps, Ignite sessions, birthday parties and school programs.'
      }
    ]
  },
  {
    slug: '3d-design-printing-for-kids',
    navLabel: '3D Design & Printing',
    title: '3D Design & Printing for Kids in Sydney',
    shortDescription: 'Take an idea from a digital 3D model to a physical printed object.',
    description:
      'Children discover how designers move from an idea to a three-dimensional model and then prepare it for fabrication. They learn that dimensions, structure and iteration matter when a digital design becomes a real object.',
    image: '/images/3d-1.jpg',
    imageAlt: 'A child learning 3D design and printing at TinkerTank',
    projects: [
      'Develop an idea as a three-dimensional digital model',
      'Consider shape, scale, structure and how an object will be made',
      'Prepare designs for 3D printing and evaluate the finished result'
    ],
    skills: ['Spatial reasoning', 'Digital modelling', 'Design iteration', 'Understanding fabrication'],
    faqs: [
      {
        question: 'Do children need 3D design experience?',
        answer: 'No. Children can begin with accessible design challenges and progress toward more detailed models as their confidence grows.'
      },
      {
        question: 'Do children get to use 3D printers?',
        answer: 'TinkerTank activities connect digital modelling with the 3D printing process. The exact printing activity and whether a project is completed during the session depend on the program and available time.'
      },
      {
        question: 'Which TinkerTank programs include 3D design and printing?',
        answer: '3D design and printing are explored throughout camps, Ignite sessions, birthday parties and school programs.'
      }
    ]
  },
  {
    slug: 'animation-for-kids',
    navLabel: 'Animation',
    title: 'Animation for Kids in Sydney',
    shortDescription: 'Bring characters and ideas to life through movement, timing and visual storytelling.',
    description:
      'Animation gives children a creative way to combine storytelling, design and technology. They plan an idea, create visual elements, experiment with movement and timing, then review and refine what the audience sees.',
    image: '/images/animation-1.png',
    imageAlt: 'A child developing a creative animation project at TinkerTank',
    projects: [
      'Plan a short story, sequence or animated idea',
      'Create characters, objects and scenes for movement',
      'Experiment with timing and refine an animation through playback'
    ],
    skills: ['Visual storytelling', 'Planning and sequencing', 'Creative technology', 'Giving and applying feedback'],
    faqs: [
      {
        question: 'Is animation suitable for children with no experience?',
        answer: 'Yes. Activities can begin with simple movement and storytelling concepts, then become more detailed as children build confidence.'
      },
      {
        question: 'What do children learn through animation?',
        answer: 'Animation develops planning, sequencing, design, timing, communication and technical problem-solving while giving children a creative way to express ideas.'
      },
      {
        question: 'Which TinkerTank programs include animation?',
        answer: 'Animation is explored across TinkerTank camps, weekly Ignite sessions, birthday parties and school programs.'
      }
    ]
  }
]

export function getLearningTopic(slug: string): LearningTopic {
  const topic = learningTopics.find(item => item.slug === slug)
  if (!topic) throw new Error(`Unknown learning topic: ${slug}`)
  return topic
}
