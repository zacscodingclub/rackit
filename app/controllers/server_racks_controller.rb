class ServerRacksController < ApplicationController
  before_action :set_server_rack, only: %i[ show edit update destroy ]

  # GET /server_racks or /server_racks.json
  def index
    @server_racks = ServerRack.all
  end

  # GET /server_racks/1 or /server_racks/1.json
  def show
  end

  # GET /server_racks/new
  def new
    @server_rack = ServerRack.new
  end

  # GET /server_racks/1/edit
  def edit
  end

  # POST /server_racks or /server_racks.json
  def create
    @server_rack = ServerRack.new(server_rack_params)

    respond_to do |format|
      if @server_rack.save
        format.html { redirect_to @server_rack, notice: "Server rack was successfully created." }
        format.json { render :show, status: :created, location: @server_rack }
      else
        format.html { render :new, status: :unprocessable_entity }
        format.json { render json: @server_rack.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /server_racks/1 or /server_racks/1.json
  def update
    respond_to do |format|
      if @server_rack.update(server_rack_params)
        format.html { redirect_to @server_rack, notice: "Server rack was successfully updated." }
        format.json { render :show, status: :ok, location: @server_rack }
      else
        format.html { render :edit, status: :unprocessable_entity }
        format.json { render json: @server_rack.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /server_racks/1 or /server_racks/1.json
  def destroy
    @server_rack.destroy!

    respond_to do |format|
      format.html { redirect_to server_racks_path, status: :see_other, notice: "Server rack was successfully destroyed." }
      format.json { head :no_content }
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_server_rack
      @server_rack = ServerRack.find(params.expect(:id))
      
      udm = ServerComponent.new("UDM", 1, 12)
      switch = ServerComponent.new("Network Switch", 1, 12)
      patch_panel = ServerComponent.new("Patch Panel", 1, 7)
      ups = ServerComponent.new("UPS", 2, 11)
      server = ServerComponent.new("Main", 4, 19)
      empty = ServerComponent.new("Empty", 1, 1)
      @components = [patch_panel, udm, switch, empty, empty, empty, empty, server, empty, ups] 
    end

    # Only allow a list of trusted parameters through.
    def server_rack_params
      params.expect(server_rack: [ :name, :height, :depth ])
    end
end

ServerComponent = Struct.new(:name, :height, :depth)