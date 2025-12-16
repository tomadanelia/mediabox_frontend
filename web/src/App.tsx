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
      <Button>Click me</Button>
      <Navbar navigationData={navigationData} />
    </div>
  )
}

export default App