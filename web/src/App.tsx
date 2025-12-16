import { Button } from "@/components/ui/button"
import Navbar from "./components/shadcn-studio/blocks/navbar-component-11/navbar-component-11"

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
    title: 'Product Details',
    href: '#'
  }
]

function App() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center">
     <div className="fixed top-0 left-0 right-0 z-50 h-56">
      <Navbar navigationData={navigationData} />
   </div>
      <Button>Click me</Button>
      
    </div>
  )
}

export default App