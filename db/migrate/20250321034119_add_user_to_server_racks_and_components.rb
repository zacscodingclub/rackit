class AddUserToServerRacksAndComponents < ActiveRecord::Migration[8.0]
  def change
    add_reference :server_racks, :user, foreign_key: true
    add_reference :components, :user, foreign_key: true
  end
end
