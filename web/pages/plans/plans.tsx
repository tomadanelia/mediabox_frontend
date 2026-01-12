import { LeafIcon, TreeDeciduousIcon, SproutIcon, TreePineIcon } from 'lucide-react'

import Pricing from '@/components/shadcn-studio/blocks/pricing-component-20/pricing-component-20'

const pricingPlans = [
    {
        title: 'Basic',
        description: 'Perfect for casual viewers and families',
        price: 0,
        features: ['10+ Channels', 'SD Streaming', '1 Device'],
        icon: LeafIcon,
        buttonLabel: 'Start Watching Free'
    },
    {
        title: 'Standard',
        description: 'Great for regular viewers and small households',
        price: 19,
        features: ['50+ Channels', 'HD Streaming', '2 Devices'],
        icon: TreeDeciduousIcon,
        buttonLabel: 'Subscribe Now'
    },
    {
        title: 'Premium',
        description: 'Ideal for entertainment lovers and larger families',
        price: 49,
        features: ['100+ Channels', 'Full HD Streaming', '4 Devices'],
        icon: SproutIcon,
        buttonLabel: 'Subscribe Now'
    },
    {
        title: 'Ultimate',
        description: 'All-access pass for TV enthusiasts',
        price: 99,
        features: ['200+ Channels', '4K Streaming', 'Unlimited Devices'],
        icon: TreePineIcon,
        isPopular: true,
        buttonLabel: 'Go Ultimate'
    }
]

const tableFeatures = [
    { feature: 'Channels', plans: ['10+', '50+', '100+', '200+'] },
    { feature: 'Streaming Quality', plans: ['SD', 'HD', 'Full HD', '4K'] },
    { feature: 'Devices', plans: ['1', '2', '4', 'Unlimited'] },
    { feature: 'On-demand Library', plans: ['-', 'Limited', 'Full', 'Full'] },
    { feature: 'Ad-free', plans: ['-', '-', 'Yes', 'Yes'] },
    { feature: 'Offline Viewing', plans: ['-', '-', 'Yes', 'Yes'] },
    { feature: 'Premium Sports', plans: ['-', '-', '-', 'Yes'] },
    { feature: 'Parental Controls', plans: ['Yes', 'Yes', 'Yes', 'Yes'] }
]

const Plans = () => {
  return <Pricing pricingPlans={pricingPlans} tableFeatures={tableFeatures} />
}

export default Plans
