import type {
  Capability,
  ContributionByType,
  ContributionType,
  PlatformContribution,
} from './contracts';

export class DuplicateCapabilityError extends Error {
  constructor(capabilityId: string) {
    super(`Capability "${capabilityId}" is already registered.`);
    this.name = 'DuplicateCapabilityError';
  }
}

export class CapabilityRegistry {
  private readonly contributions = new Map<string, PlatformContribution>();

  register(contribution: PlatformContribution): void {
    const capabilityId = contribution.capability.id;

    if (this.contributions.has(capabilityId)) {
      throw new DuplicateCapabilityError(capabilityId);
    }

    this.contributions.set(capabilityId, contribution);
  }

  getCapability(capabilityId: string): Capability | undefined {
    const contribution = this.contributions.get(capabilityId);
    return contribution ? toCapabilitySnapshot(contribution.capability) : undefined;
  }

  getContribution(capabilityId: string): PlatformContribution | undefined {
    return this.contributions.get(capabilityId);
  }

  getContributions<TContributionType extends ContributionType>(
    contributionType: TContributionType,
  ): ContributionByType[TContributionType][] {
    return [...this.contributions.values()].filter(
      (contribution): contribution is ContributionByType[TContributionType] =>
        contribution.capability.contributionType === contributionType,
    );
  }

  listCapabilities(): Capability[] {
    return [...this.contributions.values()].map((contribution) =>
      toCapabilitySnapshot(contribution.capability),
    );
  }

  listAvailableCapabilities(): Capability[] {
    return this.listCapabilities().filter((capability) => capability.enabled);
  }
}

function toCapabilitySnapshot(capability: Capability): Capability {
  return {
    id: capability.id,
    displayName: capability.displayName,
    contributionType: capability.contributionType,
    enabled: capability.enabled,
    ...(capability.featureFlagKey ? { featureFlagKey: capability.featureFlagKey } : {}),
  };
}
