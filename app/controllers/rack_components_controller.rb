class RackComponentsController < ApplicationController
  before_action :set_server_rack
  before_action :set_rack_component, only: [:update, :destroy]

  def create
    @component = Component.find(params[:component_id])
    @rack_component = @server_rack.rack_components.build(rack_component_params)
    @rack_component.component = @component

    respond_to do |format|
      if @rack_component.save
        format.html { redirect_to @server_rack, notice: 'Component was successfully added to rack.' }
        format.json { render json: @rack_component, status: :created }
      else
        error_message = @rack_component.errors.full_messages.join(". ")
        format.html { redirect_to @server_rack, alert: "Failed to add component to rack: #{error_message}" }
        format.json { render json: @rack_component.errors, status: :unprocessable_entity }
      end
    end
  end

  def update
    respond_to do |format|
      if @rack_component.update(rack_component_params)
        format.html { redirect_to @server_rack, notice: 'Component position was successfully updated.' }
        format.json { render json: @rack_component, status: :ok }
      else
        error_message = @rack_component.errors.full_messages.join(". ")
        format.html { redirect_to @server_rack, alert: "Failed to update component position: #{error_message}" }
        format.json { render json: @rack_component.errors, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    @rack_component.destroy
    respond_to do |format|
      format.html { redirect_to @server_rack, notice: 'Component was successfully removed from rack.' }
      format.json { head :no_content }
    end
  end

  private
    def set_server_rack
      @server_rack = ServerRack.find(params[:server_rack_id])
    end

    def set_rack_component
      @rack_component = @server_rack.rack_components.find(params[:id])
    end

    def rack_component_params
      params.permit(:position_y, :component_id)
    end
end
