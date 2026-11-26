export const STORAGE_KEY = 'actionable-roadmap-v1'

export const createId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

export const createRoadmapItem = (text, checked = false) => ({
  id: createId(),
  text,
  checked,
  notes: [],
  attachments: [],
})

export const sampleRoadmaps = [
  {
    id: createId(),
    title: 'Launch a Personal Portfolio Website',
    steps: [
      {
        id: createId(),
        title: 'Plan the site and gather content',
        requirements: [
          createRoadmapItem('Choose a domain name', true),
          createRoadmapItem('Collect project screenshots and links'),
          createRoadmapItem('Write a short bio and contact details'),
        ],
        tasks: [
          createRoadmapItem('Define the pages and site structure', true),
          createRoadmapItem('Draft copy for the home and about sections'),
          createRoadmapItem('Select a color palette and type scale'),
        ],
        completed: false,
      },
      {
        id: createId(),
        title: 'Build the portfolio website',
        requirements: [
          createRoadmapItem('Working development environment'),
          createRoadmapItem('Portfolio content and visual assets'),
        ],
        tasks: [
          createRoadmapItem('Create responsive page layouts'),
          createRoadmapItem('Add project cards and case studies'),
          createRoadmapItem('Add contact links and social profiles'),
        ],
        completed: false,
      },
      {
        id: createId(),
        title: 'Publish and share the site',
        requirements: [
          createRoadmapItem('Domain and hosting account'),
          createRoadmapItem('Final content review'),
        ],
        tasks: [
          createRoadmapItem('Deploy the production build'),
          createRoadmapItem('Test the site on mobile and desktop'),
          createRoadmapItem('Share the portfolio with my network'),
        ],
        completed: false,
      },
    ],
  },
]
