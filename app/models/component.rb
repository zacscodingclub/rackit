class Component < ApplicationRecord
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
end
