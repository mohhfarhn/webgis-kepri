declare module "osrm-text-instructions" {
  export interface OSRMStep {
    maneuver?: {
      type?: string;
      modifier?: string;
      bearing_before?: number;
      bearing_after?: number;
    };
    name?: string;
    ref?: string;
    exits?: string;
    distance?: number;
  }

  export interface OSRMInstructions {
    compile(
      language: string,
      step: OSRMStep,
      options?: { legIndex?: number; legCount?: number }
    ): string;
  }

  function osrmTextInstructions(version: string): OSRMInstructions;
  export default osrmTextInstructions;
}