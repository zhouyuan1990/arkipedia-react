import Head from 'next/head'

import Image from '../components/image'

function Home() {
  return (
    <div className='arkipedia'>
      <Head>
        <script src="https://kit.fontawesome.com/2acd9aa918.js"></script>
      </Head>
      <div>Welcome to Next.js!</div>
      <Image url='https://farm4.staticflickr.com/3894/15008518202_c265dfa55f_h.jpg' />
      <i className="fas fa-user"></i>
    </div>
  )
}

export default Home
