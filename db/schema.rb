# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2025_03_21_034119) do
  create_table "components", force: :cascade do |t|
    t.string "name"
    t.text "description"
    t.integer "height"
    t.integer "depth"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "color", default: "#4F46E5"
    t.integer "user_id"
    t.index ["user_id"], name: "index_components_on_user_id"
  end

  create_table "rack_components", force: :cascade do |t|
    t.integer "server_rack_id", null: false
    t.integer "component_id", null: false
    t.integer "position_y"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["component_id"], name: "index_rack_components_on_component_id"
    t.index ["server_rack_id"], name: "index_rack_components_on_server_rack_id"
  end

  create_table "server_racks", force: :cascade do |t|
    t.string "name"
    t.integer "height"
    t.float "depth"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "user_id"
    t.index ["user_id"], name: "index_server_racks_on_user_id"
  end

  create_table "sessions", force: :cascade do |t|
    t.integer "user_id", null: false
    t.string "ip_address"
    t.string "user_agent"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_sessions_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "email_address", null: false
    t.string "password_digest", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email_address"], name: "index_users_on_email_address", unique: true
  end

  add_foreign_key "components", "users"
  add_foreign_key "rack_components", "components"
  add_foreign_key "rack_components", "server_racks"
  add_foreign_key "server_racks", "users"
  add_foreign_key "sessions", "users"
end
