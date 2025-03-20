class AddColorToComponents < ActiveRecord::Migration[8.0]
  def change
    add_column :components, :color, :string, default: "#4F46E5" # Default to indigo-600
  end
end
