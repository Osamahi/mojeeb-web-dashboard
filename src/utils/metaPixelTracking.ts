/**
 * Meta Pixel tracking utilities
 *
 * @deprecated — All conversion events are now sent server-side via Facebook
 * Conversions API (CAPI) from the .NET backend. The browser Meta Pixel only
 * handles PageView (auto-fired in index.html).
 *
 * See: MojeebBackEnd/Services/Facebook/Application/Capi/
 *
 * CAPI events sent from backend:
 * - CompleteRegistration (signup)
 * - Purchase (subscription)
 * - InitiateCheckout (Stripe checkout)
 * - AgentCreated (agent creation)
 * - KnowledgeBaseCreated (KB creation)
 * - PlatformConnected (social platform OAuth)
 *
 * DO NOT add new fbq() calls here. Add CAPI tracking in the backend instead.
 */
