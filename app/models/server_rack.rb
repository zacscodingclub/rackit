class ServerRack < ApplicationRecord
  has_many :rack_components, dependent: :destroy
  has_many :components, through: :rack_components
  
  validates :name, presence: true
  validates :height, presence: true, numericality: { 
    only_integer: true, 
    greater_than: 0,
    message: "must be greater than 0"
  }
  validates :depth, presence: true, numericality: { 
    only_integer: true, 
    greater_than: 0,
    message: "must be greater than 0" 
  }
  
  # Returns true if the position range is available for a component of given height
  def position_available?(position_y, component_height)
    end_position = position_y + component_height - 1
    
    # Check if position is within rack boundaries
    return false if position_y < 1 || end_position > height
    
    # Check if position overlaps with any existing components
    rack_components.includes(:component).each do |rc|
      rc_start = rc.position_y
      rc_end = rc.position_y + rc.component.height - 1
      
      # Check if there's any overlap
      if (position_y <= rc_end) && (end_position >= rc_start)
        return false
      end
    end
    
    true
  end
end
