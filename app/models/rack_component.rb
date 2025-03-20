class RackComponent < ApplicationRecord
  belongs_to :server_rack
  belongs_to :component
  
  validates :position_y, presence: true, numericality: { 
    only_integer: true, 
    greater_than_or_equal_to: 1 
  }
  
  validate :position_within_rack_height
  validate :no_component_overlap
  
  private
  
  def position_within_rack_height
    return unless server_rack && component && position_y
    
    max_position = server_rack.height - component.height + 1
    
    if position_y > max_position
      errors.add(:position_y, "would place the component outside the rack boundaries")
    end
  end
  
  def no_component_overlap
    return unless server_rack && component && position_y
    
    # Calculate the range of positions this component would occupy
    start_position = position_y
    end_position = position_y + component.height - 1
    
    # Find any existing components that overlap with this position range
    overlapping_components = server_rack.rack_components
      .where.not(id: id) # Exclude self when updating
      .includes(:component)
      .select do |rc|
        rc_start = rc.position_y
        rc_end = rc.position_y + rc.component.height - 1
        
        # Check if there's any overlap
        (start_position <= rc_end) && (end_position >= rc_start)
      end
    
    if overlapping_components.any?
      errors.add(:position_y, "would overlap with existing components")
    end
  end
end
