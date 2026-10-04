import '../styles/home.css'

function Hero() {
  return (
    <section className="hero">
      <div className="hero-content">
        <span className="hero-label">OFERTAS ESPECIALES</span>

        <h1>
          Tecnología para
          <br />
          todos
        </h1>

        <p>
          Encuentra accesorios y dispositivos tecnológicos
          al mejor precio.
        </p>

        <button>
          Comprar ahora
        </button>
      </div>

      <div className="hero-decoration">
        <div className="device">⌚</div>
        <div className="device">🎧</div>
        <div className="device">🔌</div>
      </div>
    </section>
  )
}

export default Hero