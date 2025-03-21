require "test_helper"

class ServerRacksControllerTest < ActionDispatch::IntegrationTest
  setup do
    @server_rack = server_racks(:one)
    @user = users(:one)
    sign_in_as(@user)
  end

  test "should get index" do
    get server_racks_url
    assert_response :success
  end

  test "should get new" do
    get new_server_rack_url
    assert_response :success
  end

  test "should create server_rack" do
    assert_difference("ServerRack.count") do
      post server_racks_url, params: { server_rack: { depth: @server_rack.depth, height: @server_rack.height, name: "New Test Rack" } }
    end

    assert_redirected_to server_rack_url(ServerRack.last)
  end

  test "should show server_rack" do
    get server_rack_url(@server_rack)
    assert_response :success
  end

  test "should get edit" do
    get edit_server_rack_url(@server_rack)
    assert_response :success
  end

  test "should update server_rack" do
    patch server_rack_url(@server_rack), params: { server_rack: { depth: @server_rack.depth, height: @server_rack.height, name: @server_rack.name } }
    assert_redirected_to server_rack_url(@server_rack)
  end

  test "should destroy server_rack" do
    assert_difference("ServerRack.count", -1) do
      delete server_rack_url(@server_rack)
    end

    assert_redirected_to server_racks_url
  end
end
