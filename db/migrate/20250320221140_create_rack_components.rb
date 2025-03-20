class CreateRackComponents < ActiveRecord::Migration[8.0]
  def change
    create_table :rack_components do |t|
      t.references :server_rack, null: false, foreign_key: true
      t.references :component, null: false, foreign_key: true
      t.integer :position_y

      t.timestamps
    end
  end
end
