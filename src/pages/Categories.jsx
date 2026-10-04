import Header from '../components/Header'
import Navbar from '../components/Navbar'
import CategoryCard from '../components/CategoryCard'
import Footer from '../components/Footer'

import '../styles/home.css'

function Categories() {
  const categories = [
    {
      id: 1,
      icon: '🎧',
      name: 'Audio',
    },
    {
      id: 2,
      icon: '🔌',
      name: 'Cargadores',
    },
    {
      id: 3,
      icon: '🔗',
      name: 'Cables',
    },
    {
      id: 4,
      icon: '🔋',
      name: 'Energía',
    },
    {
      id: 5,
      icon: '⌚',
      name: 'Relojes',
    },
    {
      id: 6,
      icon: '💻',
      name: 'Computación',
    },
    {
      id: 7,
      icon: '🎮',
      name: 'Gaming',
    },
    {
      id: 8,
      icon: '📱',
      name: 'Soportes',
    },
    {
      id: 9,
      icon: '🔄',
      name: 'Adaptadores',
    },
    {
      id: 10,
      icon: '📷',
      name: 'Cámaras y Webcam',
    },
    {
      id: 11,
      icon: '💾',
      name: 'Almacenamiento',
    },
    {
      id: 12,
      icon: '📦',
      name: 'Otros accesorios',
    },
  ]

  return (
    <>
      <Header />
      <Navbar />

      <main>
        <section className="categories-section">

          <div className="categories-title">
            <div>
              <h2>Todas las categorías</h2>

              <p>
                Explora nuestros productos por categoría.
              </p>
            </div>
          </div>

          <div className="categories">

            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                icon={category.icon}
                name={category.name}
              />
            ))}

          </div>

        </section>
      </main>

      <Footer />
    </>
  )
}

export default Categories