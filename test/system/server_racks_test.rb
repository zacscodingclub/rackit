require "application_system_test_case"

class ServerRacksTest < ApplicationSystemTestCase
  setup do
    @server_rack = server_racks(:one)
  end

  test "visiting the index" do
    visit server_racks_url
    assert_selector "h1", text: "Server racks"
  end

  test "should create server rack" do
    visit server_racks_url
    click_on "New server rack"

    fill_in "Depth", with: @server_rack.depth
    fill_in "Height", with: @server_rack.height
    fill_in "Name", with: @server_rack.name
    click_on "Create Server rack"

    assert_text "Server rack was successfully created"
    click_on "Back"
  end

  test "should update Server rack" do
    visit server_rack_url(@server_rack)
    click_on "Edit this server rack", match: :first

    fill_in "Depth", with: @server_rack.depth
    fill_in "Height", with: @server_rack.height
    fill_in "Name", with: @server_rack.name
    click_on "Update Server rack"

    assert_text "Server rack was successfully updated"
    click_on "Back"
  end

  test "should destroy Server rack" do
    visit server_rack_url(@server_rack)
    click_on "Destroy this server rack", match: :first

    assert_text "Server rack was successfully destroyed"
  end
end
