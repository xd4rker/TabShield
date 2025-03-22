/**
 * Enum representing the label colors.
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
 * Enum representing the possible positions for the label.
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
   * Whether to display the label on the page.
   */
  displayLabel: boolean;

  /**
   * The text of the custom label (optional).
   */
  label?: string;

  /**
   * The color of the label. Defaults to `#dd2d23`.
   */
  labelColor: string;

  /**
   * The position of the label. Defaults to `BOTTOM_MIDDLE`.
   */
  labelPosition: LabelPosition;

  /**
   * Whether to confirm before submitting forms.
   */
  confirmForms: boolean;

  /**
   * Whether to disable all form inputs.
   */
  disableInputs: boolean;
}
