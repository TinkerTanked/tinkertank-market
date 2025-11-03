import Link from 'next/link'
import { getFeaturedCatalogProducts } from '@/lib/productCatalog'
import ProductCard from '@/components/ui/ProductCard'

export default function HomePage() {
  const featuredProducts = getFeaturedCatalogProducts(6)

  return (
    <div>
      {/* Hero Section */}
      <section className='hero-gradient text-white py-20 lg:py-32'>
        <div className='container-custom'>
          <div className='grid lg:grid-cols-2 gap-12 items-center'>
            <div className='space-y-8'>
              <div className='space-y-4'>
                <h1 className='text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-tight text-shadow-sm'>
                  Where <span className='text-yellow-300'>Science</span> Meets <span className='text-yellow-300'>Adventure</span>
                </h1>
                <p className='text-xl md:text-2xl font-light text-blue-100 max-w-2xl'>
                  Join TinkerTank for hands-on STEM learning experiences that spark creativity and inspire the next generation of innovators
                </p>
              </div>

              <div className='flex flex-col sm:flex-row gap-4'>
                <Link href='/camps' className='btn-secondary text-lg px-8 py-4 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300'>
                  Book a Camp
                </Link>
                <Link href='/about' className='btn-outline border-white text-white hover:bg-white hover:text-primary-600 text-lg px-8 py-4'>
                  Learn More
                </Link>
              </div>

              <div className='flex items-center space-x-8 text-blue-100'>
                <div className='flex items-center space-x-2'>
                  <div className='w-3 h-3 bg-yellow-300 rounded-full animate-pulse'></div>
                  <span className='font-medium'>Ages 5-16</span>
                </div>
                <div className='flex items-center space-x-2'>
                  <div className='w-3 h-3 bg-yellow-300 rounded-full animate-pulse animation-delay-200'></div>
                  <span className='font-medium'>Hands-on Learning</span>
                </div>
                <div className='flex items-center space-x-2'>
                  <div className='w-3 h-3 bg-yellow-300 rounded-full animate-pulse animation-delay-400'></div>
                  <span className='font-medium'>Expert Instructors</span>
                </div>
              </div>
            </div>

            <div className='relative'>
              <div className='bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20'>
                <div className='space-y-6'>
                  <div className='text-center space-y-2'>
                    <div className='text-5xl'>🔬</div>
                    <h3 className='text-2xl font-display font-semibold'>Science Experiments</h3>
                  </div>
                  <div className='grid grid-cols-2 gap-4'>
                    <div className='text-center space-y-2'>
                      <div className='text-3xl'>🤖</div>
                      <p className='text-sm font-medium'>Robotics</p>
                    </div>
                    <div className='text-center space-y-2'>
                      <div className='text-3xl'>💻</div>
                      <p className='text-sm font-medium'>Coding</p>
                    </div>
                    <div className='text-center space-y-2'>
                      <div className='text-3xl'>🔧</div>
                      <p className='text-sm font-medium'>Engineering</p>
                    </div>
                    <div className='text-center space-y-2'>
                      <div className='text-3xl'>🎨</div>
                      <p className='text-sm font-medium'>Design</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <div className='absolute -top-4 -right-4 w-20 h-20 bg-yellow-300 rounded-full opacity-20 animate-bounce-gentle'></div>
              <div className='absolute -bottom-6 -left-6 w-16 h-16 bg-accent-400 rounded-full opacity-30 animate-pulse-slow'></div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className='py-16 bg-gray-50'>
        <div className='container-custom'>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-8'>
            <div className='text-center'>
              <div className='text-4xl font-display font-bold text-primary-600 mb-2'>500+</div>
              <div className='text-gray-600 font-medium'>Happy Kids</div>
            </div>
            <div className='text-center'>
              <div className='text-4xl font-display font-bold text-primary-600 mb-2'>50+</div>
              <div className='text-gray-600 font-medium'>Camps Run</div>
            </div>
            <div className='text-center'>
              <div className='text-4xl font-display font-bold text-primary-600 mb-2'>15+</div>
              <div className='text-gray-600 font-medium'>STEM Topics</div>
            </div>
            <div className='text-center'>
              <div className='text-4xl font-display font-bold text-primary-600 mb-2'>98%</div>
              <div className='text-gray-600 font-medium'>Parent Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Programs */}
      <section className='py-20'>
        <div className='container-custom'>
          <div className='text-center space-y-4 mb-12'>
            <h2 className='text-3xl md:text-4xl font-display font-bold text-gray-900'>
              Popular Programs
            </h2>
            <p className='text-xl text-gray-600 max-w-3xl mx-auto'>
              Discover our most loved STEM experiences that kids can't stop talking about
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className='text-center mt-12'>
            <Link href='/catalog' className='btn-outline text-lg px-8 py-4'>
              View All Programs
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className='py-20 bg-gradient-to-br from-primary-50 to-accent-50'>
        <div className='container-custom'>
          <div className='text-center space-y-4 mb-12'>
            <h2 className='text-3xl md:text-4xl font-display font-bold text-gray-900'>
              What Parents Are Saying
            </h2>
            <p className='text-xl text-gray-600'>
              Hear from families who've experienced the TinkerTank difference
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            <div className='bg-white rounded-xl p-8 shadow-lg'>
              <div className='space-y-4'>
                <div className='flex text-yellow-400'>
                  {'★'.repeat(5)}
                </div>
                <p className='text-gray-700 italic'>
                  "My daughter absolutely loves the robotics camp! She comes home excited every day and can't wait to show us what she's built. The instructors are amazing."
                </p>
                <div className='flex items-center space-x-3'>
                  <div className='w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center'>
                    <span className='font-semibold text-primary-600'>SM</span>
                  </div>
                  <div>
                    <p className='font-semibold text-gray-900'>Sarah M.</p>
                    <p className='text-sm text-gray-500'>Parent of Emma (8)</p>
                  </div>
                </div>
              </div>
            </div>

            <div className='bg-white rounded-xl p-8 shadow-lg'>
              <div className='space-y-4'>
                <div className='flex text-yellow-400'>
                  {'★'.repeat(5)}
                </div>
                <p className='text-gray-700 italic'>
                  "The birthday party was incredible! All 12 kids were engaged the entire time. The staff managed everything perfectly and my son felt so special."
                </p>
                <div className='flex items-center space-x-3'>
                  <div className='w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center'>
                    <span className='font-semibold text-primary-600'>JC</span>
                  </div>
                  <div>
                    <p className='font-semibold text-gray-900'>James C.</p>
                    <p className='text-sm text-gray-500'>Parent of Lucas (10)</p>
                  </div>
                </div>
              </div>
            </div>

            <div className='bg-white rounded-xl p-8 shadow-lg'>
              <div className='space-y-4'>
                <div className='flex text-yellow-400'>
                  {'★'.repeat(5)}
                </div>
                <p className='text-gray-700 italic'>
                  "The Ignite program has been amazing for my shy daughter. She's gained so much confidence and loves problem-solving now. Highly recommend!"
                </p>
                <div className='flex items-center space-x-3'>
                  <div className='w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center'>
                    <span className='font-semibold text-primary-600'>RT</span>
                  </div>
                  <div>
                    <p className='font-semibold text-gray-900'>Rachel T.</p>
                    <p className='text-sm text-gray-500'>Parent of Zoe (7)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className='py-20 bg-white'>
        <div className='container-custom'>
          <div className='bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-12 text-center text-white'>
            <div className='space-y-6'>
              <h2 className='text-3xl md:text-4xl font-display font-bold'>
                Ready to Spark Your Child's Curiosity?
              </h2>
              <p className='text-xl text-blue-100 max-w-2xl mx-auto'>
                Join hundreds of families who've discovered the joy of hands-on STEM learning
              </p>
              <div className='flex flex-col sm:flex-row gap-4 justify-center items-center'>
                <Link href='/camps' className='btn-secondary text-lg px-8 py-4'>
                  Book a Camp
                </Link>
                <Link href='/contact' className='btn-outline border-white text-white hover:bg-white hover:text-primary-600 text-lg px-8 py-4'>
                  Ask Questions
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
