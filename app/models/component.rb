class Component < ApplicationRecord
  belongs_to :user, optional: true
  has_many :rack_components, dependent: :destroy
  has_many :server_racks, through: :rack_components
  
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
  
  # Set default color if none is provided
  before_save :set_default_color
  
  private
  
  def set_default_color
    self.color = "#3B82F6" if color.blank? # Default blue color
  end
end
