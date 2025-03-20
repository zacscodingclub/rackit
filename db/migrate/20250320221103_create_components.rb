class CreateComponents < ActiveRecord::Migration[8.0]
  def change
    create_table :components do |t|
      t.string :name
      t.text :description
      t.integer :height
      t.integer :depth

      t.timestamps
    end
  end
end
