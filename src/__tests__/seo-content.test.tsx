import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import CodingForKidsPage, { metadata as codingMetadata } from '@/app/coding-for-kids/page'
import { metadata as igniteMetadata } from '@/app/ignite/page'
import { getProductById } from '@/data/products'
import { getLearningTopic } from '@/data/learningTopics'
import { createLearningTopicMetadata } from '@/lib/learning-topic-seo'
import { createProductMetadata } from '@/lib/product-seo'

describe('search-intent SEO content', () => {
  it('targets coding-party searches with specific, truthful activities', () => {
    const product = getProductById('coding-party')
    expect(product).toBeDefined()

    const metadata = createProductMetadata(product!, 'birthdays')
    expect(metadata.title).toBe('Kids Coding Party Sydney - Minecraft & Scratch')
    expect(metadata.description).toContain('Minecraft, Scratch and age-appropriate AI activities')
  })

  it('targets after-school search intent on the Ignite hub and product pages', () => {
    const dropOffProduct = getProductById('drop-off-ignite')
    expect(dropOffProduct).toBeDefined()

    const dropOffMetadata = createProductMetadata(dropOffProduct!, 'subscriptions')
    expect(igniteMetadata.title).toBe('After-School Coding & Robotics Classes Sydney')
    expect(dropOffMetadata.title).toBe('After-School Coding & Robotics Neutral Bay')
  })

  it('gives robotics and coding search results tailored descriptions', () => {
    const roboticsMetadata = createLearningTopicMetadata(getLearningTopic('robotics-for-kids'))

    expect(roboticsMetadata.title).toBe('Robotics for Kids Sydney - Classes, Camps & Parties')
    expect(roboticsMetadata.description).toContain('beginner-friendly programs for ages 5-16')
    expect(codingMetadata.title).toBe('Coding & Minecraft Programs for Kids in Sydney')
    expect(codingMetadata.description).toContain('Scratch, Minecraft, games and age-appropriate AI tools')
  })

  it('explains the distinct coding pathways on the coding page', () => {
    render(<CodingForKidsPage />)

    expect(screen.getByRole('heading', { name: 'Minecraft, Scratch & AI Coding for Kids' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Minecraft projects' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Scratch game creation' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Age-appropriate AI' })).toBeInTheDocument()
  })
})
