class AddBrandToComponents < ActiveRecord::Migration[8.0]
  def change
    add_column :components, :brand, :string
  end
end
