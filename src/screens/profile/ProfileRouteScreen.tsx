import type { ComponentType } from 'react'
import type { ProfileRoute } from '../../types/profile'
import { KycDetailsScreen } from './KycDetailsScreen'
import { LinkedAccountsScreen } from './LinkedAccountsScreen'
import { SecuritySettingsScreen } from './SecuritySettingsScreen'
import { LegalDocumentsScreen } from './LegalDocumentsScreen'
import { HelpCenterScreen } from './HelpCenterScreen'
import { RiskDisclosureScreen } from './RiskDisclosureScreen'
import { SupportTicketScreen } from './SupportTicketScreen'

interface ProfileRouteScreenProps {
  route: ProfileRoute
  onBack: () => void
}

const ROUTE_SCREENS: Record<ProfileRoute, ComponentType<{ onBack: () => void }>> = {
  'kyc-details': KycDetailsScreen,
  'linked-accounts': LinkedAccountsScreen,
  'security-settings': SecuritySettingsScreen,
  'legal-documents': LegalDocumentsScreen,
  'help-center': HelpCenterScreen,
  'risk-disclosure': RiskDisclosureScreen,
  'support-ticket': SupportTicketScreen,
}

export function ProfileRouteScreen({ route, onBack }: ProfileRouteScreenProps) {
  const Screen = ROUTE_SCREENS[route]
  return <Screen onBack={onBack} />
}

export {
  KycDetailsScreen,
  LinkedAccountsScreen,
  SecuritySettingsScreen,
  LegalDocumentsScreen,
  HelpCenterScreen,
  RiskDisclosureScreen,
  SupportTicketScreen,
}
