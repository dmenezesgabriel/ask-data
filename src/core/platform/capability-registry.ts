import type {
  Capability,
  CapabilityEvent,
  CapabilitySnapshot,
  ContributionByType,
  ContributionType,
  FeatureFlagProvider,
  PlatformContribution,
} from './contracts';
import { PLATFORM_OBSERVABILITY_EVENTS } from './observability-events';

export class StaticFeatureFlagProvider implements FeatureFlagProvider {
  constructor(private readonly flags: Readonly<Record<string, boolean>> = {}) {}

  isEnabled(flagKey: string, defaultValue = true): boolean {
    return this.flags[flagKey] ?? defaultValue;
  }
}

export class DuplicateCapabilityError extends Error {
  constructor(capabilityId: string) {
    super(`Capability "${capabilityId}" is already registered.`);
    this.name = 'DuplicateCapabilityError';
  }
}

export class CapabilityDisabledError extends Error {
  constructor(
    readonly capabilityId: string,
    readonly caller = 'unknown',
  ) {
    super(`Capability "${capabilityId}" is disabled.`);
    this.name = 'CapabilityDisabledError';
  }
}

export type CapabilityRegistryOptions = {
  featureFlags?: FeatureFlagProvider;
  onEvent?: (event: CapabilityEvent) => void;
};

export class CapabilityRegistry {
  private readonly contributions = new Map<string, PlatformContribution>();
  private readonly featureFlags: FeatureFlagProvider;
  private readonly onEvent?: (event: CapabilityEvent) => void;

  constructor(options: CapabilityRegistryOptions = {}) {
    this.featureFlags = options.featureFlags ?? new StaticFeatureFlagProvider();
    this.onEvent = options.onEvent;
  }

  register(contribution: PlatformContribution): void {
    const capabilityId = contribution.capability.id;

    if (this.contributions.has(capabilityId)) {
      this.emit(PLATFORM_OBSERVABILITY_EVENTS.capabilityRegistrationFailed, contribution);
      throw new DuplicateCapabilityError(capabilityId);
    }

    this.contributions.set(capabilityId, contribution);
    this.emit(PLATFORM_OBSERVABILITY_EVENTS.capabilityRegistrationSucceeded, contribution);
  }

  getCapability(capabilityId: string): Capability | undefined {
    const contribution = this.contributions.get(capabilityId);
    return contribution ? this.toCapabilitySnapshot(contribution.capability) : undefined;
  }

  getContribution(capabilityId: string): PlatformContribution | undefined {
    const contribution = this.contributions.get(capabilityId);
    if (!contribution || !this.isCapabilityEnabled(contribution.capability)) return undefined;
    return contribution;
  }

  requireCapability(capabilityId: string, caller = 'unknown'): Capability {
    const contribution = this.contributions.get(capabilityId);
    const capability = contribution
      ? this.toCapabilitySnapshot(contribution.capability)
      : undefined;

    if (!capability?.enabled) {
      const contributionType = contribution?.capability.contributionType ?? 'datasource-connector';
      this.onEvent?.({
        event: PLATFORM_OBSERVABILITY_EVENTS.capabilityAccessDisabled,
        capabilityId,
        contributionType,
        caller,
      });
      throw new CapabilityDisabledError(capabilityId, caller);
    }

    return capability;
  }

  getContributions<TContributionType extends ContributionType>(
    contributionType: TContributionType,
  ): ContributionByType[TContributionType][] {
    return [...this.contributions.values()].filter(
      (contribution): contribution is ContributionByType[TContributionType] =>
        contribution.capability.contributionType === contributionType &&
        this.isCapabilityEnabled(contribution.capability),
    );
  }

  listCapabilities(): Capability[] {
    return [...this.contributions.values()].map((contribution) =>
      this.toCapabilitySnapshot(contribution.capability),
    );
  }

  listAvailableCapabilities(): Capability[] {
    return this.listCapabilities().filter((capability) => capability.enabled);
  }

  getSnapshot(): CapabilitySnapshot {
    return Object.freeze({ capabilities: Object.freeze(this.listAvailableCapabilities()) });
  }

  private isCapabilityEnabled(capability: Capability): boolean {
    const enabledByContribution = capability.enabled;
    const enabledByFlag = capability.featureFlagKey
      ? this.featureFlags.isEnabled(capability.featureFlagKey, true)
      : true;
    return enabledByContribution && enabledByFlag;
  }

  private emit(event: string, contribution: PlatformContribution): void {
    this.onEvent?.({
      event,
      capabilityId: contribution.capability.id,
      contributionType: contribution.capability.contributionType,
    });
  }

  private toCapabilitySnapshot(capability: Capability): Capability {
    return Object.freeze({
      id: capability.id,
      displayName: capability.displayName,
      contributionType: capability.contributionType,
      enabled: this.isCapabilityEnabled(capability),
      ...(capability.featureFlagKey ? { featureFlagKey: capability.featureFlagKey } : {}),
    });
  }
}
