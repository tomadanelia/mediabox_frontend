import Navbar from "./components/shadcn-studio/blocks/navbar-component-11/navbar-component-11"
import Pricing from "./components/shadcn-studio/blocks/pricing-component-12/pricing-component-12"
const navigationData = [
  {
    title: 'Home',
    href: '#'
  },
  {
    title: 'Dashboard',
    href: '#'
  },
  {
    title: 'Pricing',
    href: '#'
  },
  {
    title: 'Access Details',
    href: '#'
  }
]
import { RocketIcon, EclipseIcon } from 'lucide-react'
const plans = [
  {
    icon: EclipseIcon,
    name: 'Basic',
    price: 49,
    description: 'For those new to the crypto market or looking for a simple and easy-to-use platform.',
    features: [
      'Basic Portfolio Tracking',
      'Access to Crypto News',
      'Standard Customer Support',
      'Educational Resources',
      'Advanced Analytics Tools'
    ]
  },
  {
    icon: RocketIcon,
    name: 'Premium',
    price: 99,
    description: 'For those who want to experience full MediaBox features.',
    features: [
      'Dedicated Account Manager',
      '24/7 Real-Time Market Analysis',
      'Personalized Portfolio Reviews',
      'Invitations to Premium Webinars',
      'Access to Exclusive Industry Reports'
    ]
  }
]


function App() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center">
     <div className="fixed top-0 left-0 right-0 z-50 h-56">
      <Navbar navigationData={navigationData} />
   </div>      
      <div className="w-lvw"><Pricing plans={plans}/></div>
    </div>
  )
}

export default App