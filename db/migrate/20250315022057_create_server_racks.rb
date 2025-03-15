class CreateServerRacks < ActiveRecord::Migration[8.0]
  def change
    create_table :server_racks do |t|
      t.string :name
      t.integer :height
      t.float :depth

      t.timestamps
    end
  end
end
