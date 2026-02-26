import { LeafIcon } from 'lucide-react'
import Pricing from '../../src/components/shadcn-studio/blocks/pricing-component-20/pricing-component-20'
import { useEffect, useState } from 'react'
import { API_BASE_URL } from '@/config';

const tableFeatures = [
  { feature: 'Channels', plans: ['10+', '50+', '100+', '200+'] },
  { feature: 'Devices', plans: ['1', '2', '4', 'Unlimited'] },
  { feature: 'On-demand Library', plans: ['-', 'Limited', 'Full', 'Full'] },
  { feature: 'Ad-free', plans: ['-', '-', 'Yes', 'Yes'] },
  { feature: 'Offline Viewing', plans: ['-', '-', 'Yes', 'Yes'] },
  { feature: 'Premium Sports', plans: ['-', '-', '-', 'Yes'] },
  { feature: 'Parental Controls', plans: ['Yes', 'Yes', 'Yes', 'Yes'] }
]

const Plans = () => {
  const [plans, setPlans] = useState<any[]>([])

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/plans`)
      .then(res => res.json())
      .then(data => {
        const formatted = data
          .filter((plan: any) => plan.is_active)
          .map((plan: any, index: number) => ({
            title: plan.name_ka,
            description: plan.description_ka,
            price: Number(plan.price),
            features: [
              `ხანგრძლივობა ${plan.duration_days} დღე`,
              `${plan.description_ka}`,
            ],
            icon: LeafIcon,
            buttonLabel: 'აირჩიე პაკეტი',
            isPopular: index === 1 // mark second plan as popular
          }))

        setPlans(formatted)
      })
      .catch(err => console.error(err))
  }, [])

  return <Pricing pricingPlans={plans}  />
}

export default Plans;