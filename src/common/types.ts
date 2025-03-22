/**
 * Label colors.
 */
export enum LabelColor {
  RED = '#dd2d23',
  YELLOW = '#efa500',
  GRAY = '#666f75',
  BLUE = '#3d70b2',
  PINK = '#f40058',
  GREEN = '#198d41'
}

/**
 * Label positions.
 */
export enum LabelPosition {
  UP_LEFT = 'up-left',
  UP_MIDDLE = 'up-middle',
  UP_RIGHT = 'up-right',
  BOTTOM_LEFT = 'bottom-left',
  BOTTOM_MIDDLE = 'bottom-middle',
  BOTTOM_RIGHT = 'bottom-right'
}

export interface DomainConfig {
  /**
   * Display a label on the page.
   */
  displayLabel: boolean;

  /**
   * The text of the custom label.
   */
  label?: string;

  /**
   * The color of the label.
   */
  labelColor: string;

  /**
   * The position of the label.
   */
  labelPosition: LabelPosition;

  /**
   * Confirm form submissions.
   */
  confirmForms: boolean;

  /**
   * Disable all form inputs.
   */
  disableInputs: boolean;
}
